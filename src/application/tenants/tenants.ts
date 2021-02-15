import {httpReqHandler} from 'application/errorHandling';
import {S3} from 'aws-sdk';
import db from 'infrastructure/db';
import {BaseError} from 'application/errorHandling';
import paymentService from 'infrastructure/paymentService';
import {createTenant} from 'domain/entities';
import authService from 'infrastructure/authService';

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
      const bucket = process.env.S3_BUCKET!;
      const params = {Bucket: bucket, Key: tenant.theme, Expires: 100};
      const url = await new S3().getSignedUrlPromise('getObject', params);
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
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET!;
    const listParams = {Bucket: bucket, Prefix: tenantId};

    const {Contents} = await s3.listObjects(listParams).promise();
    if (!Contents?.length) return;

    const keys = Contents.map(({Key}) => ({Key: Key || ''}));
    const delParams = {Bucket: bucket, Delete: {Objects: keys}};
    await s3.deleteObjects(delParams).promise();
  };

  return {create, retrieve, del};
};
