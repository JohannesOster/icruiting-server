import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import {BaseError, catchAsync} from 'errorHandling';
import db from 'db';
import {mapCognitoUser} from 'components/utils';
import {signUp} from './signUp';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const createTenant = catchAsync(async (req, res) => {
  const {tenantName, name, email, password, stripePriceId} = req.body;
  const {id} = await stripe.customers.create({email});
  const subscription = await stripe.subscriptions.create({
    customer: id,
    items: [{price: stripePriceId}],
    trial_period_days: 14,
  });
  const tenant = await db.tenants.insert({tenantName, stripeCustomerId: id});
  const {User} = await signUp(tenant.tenantId, name, email, password);
  res.status(201).json({user: User, tenant, subscription});
});

export const deleteTenant = catchAsync(async (req, res) => {
  const {userPoolID, tenantId} = res.locals.user;

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (tenant.stripeCustomerId) {
    await stripe.customers.del(tenant.stripeCustomerId);
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
  await db.tenants.delete(tenantId);

  res.status(200).json();
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
