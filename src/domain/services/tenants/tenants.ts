import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import db from 'infrastructure/db';
import {BaseError} from 'adapters/errorHandling';
import {mapCognitoUser} from 'adapters/utils';
import {signUp} from './signUp';
import payment from 'infrastructure/payment';

export const TenantService = () => {
  const create = async (
    tenantName: string,
    email: string,
    password: string,
    subscriptionsId: string,
  ) => {
    const {customerId} = await payment.customers.create(email, subscriptionsId);
    const tenant = await db.tenants.create({
      tenantName,
      stripeCustomerId: customerId,
    });
    const {User} = await signUp({tenantId: tenant.tenantId, email, password});

    return {user: User, tenant};
  };

  const retrieve = async (tenantId: string) => {
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

    return tenant;
  };

  const del = async (tenantId: string, userPoolID: string) => {
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
  };

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
