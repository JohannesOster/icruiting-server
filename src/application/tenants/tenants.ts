import {httpReqHandler} from 'application/errorHandling';
import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import db from 'infrastructure/db';
import {BaseError} from 'application/errorHandling';
import {mapCognitoUser} from 'application/utils';
import {signUp} from './signUp';
import payment from 'infrastructure/payment';
import {createTenant} from 'domain/entities';

export const TenantsAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {tenantName, email, password, stripePriceId} = req.body;
    const {customerId} = await payment.customers.create(email, stripePriceId);
    const tenant = await db.tenants.create(
      createTenant({
        tenantName,
        stripeCustomerId: customerId,
      }),
    );
    const {User} = await signUp({tenantId: tenant.tenantId, email, password});

    return {status: 201, body: {tenant, user: User}};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    let tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (tenant.theme) {
      const url = await new S3().getSignedUrlPromise('getObject', {
        Bucket: process.env.S3_BUCKET!,
        Key: tenant.theme,
        Expires: 100,
      });
      tenant = {...tenant, theme: url};
    }
    return {body: tenant};
  });

  const del = httpReqHandler(async (req) => {
    const {userPoolID, tenantId} = req.user;
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (tenant.stripeCustomerId) {
      await payment.customers.del(tenant.stripeCustomerId);
    }

    deleteTenantFiles(tenantId);

    const cIdp = new CognitoIdentityServiceProvider();
    const params = {
      UserPoolId: userPoolID,
      AttributesToGet: ['email', 'custom:tenant_id'],
    };

    const users = await cIdp
      .listUsers(params)
      .promise()
      .then(({Users}) => {
        if (!Users) return [];
        const users = Users.map((user) => mapCognitoUser(user));

        // filter out foreign tenants
        return users.filter((user) => user['custom:tenant_id'] === tenantId);
      });

    const promises = users.map((user) => {
      const params = {UserPoolId: userPoolID, Username: user.email};
      return cIdp.adminDeleteUser(params).promise();
    });

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
