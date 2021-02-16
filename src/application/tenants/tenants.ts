import {httpReqHandler} from 'application/errorHandling';
import db from 'infrastructure/db';
import {BaseError} from 'application/errorHandling';
import paymentService from 'infrastructure/paymentService';
import {createTenant} from 'domain/entities';
import authService from 'infrastructure/authService';
import storageService from 'infrastructure/storageService';

export const TenantsAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {tenantName, email, password, stripePriceId} = req.body;
    const {customerId} = await paymentService.customers.create(
      email,
      stripePriceId,
    );
    const tenant = await db.tenants.create(
      createTenant({tenantName, stripeCustomerId: customerId}),
    );
    const {user} = await authService.signUpUser({
      tenantId: tenant.tenantId,
      email,
      password,
    });

    return {status: 201, body: {tenant, user}};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    let tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (tenant.theme) {
      const url = await storageService.getUrl(tenant.theme);
      tenant = {...tenant, theme: url};
    }

    return {body: tenant};
  });

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (tenant.stripeCustomerId) {
      await paymentService.customers.del(tenant.stripeCustomerId);
    }

    deleteTenantFiles(tenantId);

    const users = await authService.listUsers(tenantId);
    const promises = users.map(({email}) => authService.deleteUser(email));

    await Promise.all(promises || []);
    await db.tenants.del(tenantId);

    return {};
  });

  const deleteTenantFiles = async (tenantId: string) => {
    const files = await storageService.list(tenantId);
    if (!files?.length) return;

    const keys = files.map(({Key}) => Key || '');
    await storageService.bulkDel(keys);
  };

  return {create, retrieve, del};
};
