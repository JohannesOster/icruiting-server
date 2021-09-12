import {BaseError} from 'application/errorHandling';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';
import paymentService from 'infrastructure/paymentService';
import authService from 'infrastructure/authService';
import storageService from 'infrastructure/storageService';
import {filterNotNullAndDefined} from 'utils/filterNotNullAndDefined';
import {DB} from '../infrastructure/repositories';
import {createTenant} from '../domain';
import {tenantsMapper} from '../mappers';

export const TenantsAdapter = (db: DB) => {
  const create = httpReqHandler(async (req) => {
    const {tenantName, email, password, stripePriceId} = req.body;
    const {customerId} = await paymentService.customers.create(
      email,
      stripePriceId,
    );

    const tenant = createTenant({tenantName, stripeCustomerId: customerId});
    const props = tenantsMapper.toPersistance(tenant);
    const raw = await db.tenants.create(props);
    const tenantDTO = tenantsMapper.toDTO(raw);

    const signUpParams = {tenantId: tenant.id, email, password};
    const {user} = await authService.signUpUser(signUpParams);

    return {status: 201, body: {tenant: tenantDTO, user}};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (tenant.theme) tenant.theme = await storageService.getUrl(tenant.theme);

    return {body: tenant};
  });

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (tenant.stripeCustomerId)
      await paymentService.customers.del(tenant.stripeCustomerId);

    _deleteTenantFiles(tenantId);

    const users = await authService.listUsers(tenantId);
    if (users.length) {
      const promises = users.map(({email}) => authService.deleteUser(email));
      await Promise.all(promises);
    }

    await db.tenants.del(tenantId);

    return {};
  });

  const _deleteTenantFiles = async (tenantId: string) => {
    const files = await storageService.list(tenantId);
    if (!files?.length) return {};

    const keys = files.map(({Key}) => Key).filter(filterNotNullAndDefined);
    await storageService.bulkDel(keys);
  };

  return {create, retrieve, del};
};
