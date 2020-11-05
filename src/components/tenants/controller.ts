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

export const getSubscriptions = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't access subscriptions of other tenants.`);
  }

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  const subscriptions = await stripe.subscriptions.list({
    customer: tenant.stripeCustomerId,
    expand: ['data.plan.product'],
  });

  res.status(200).json(subscriptions.data);
});

export const deleteSubscription = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;
  const {subscriptionId} = req.params;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't access subscriptions of other tenants.`);
  }

  await stripe.subscriptions.del(subscriptionId);
  res.status(200).json({});
});

export const postSubscription = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;
  const {priceId} = req.body;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't access subscriptions of other tenants.`);
  }

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  const subscription = await stripe.subscriptions.create({
    customer: tenant.stripeCustomerId,
    items: [{price: priceId}],
  });

  res.status(200).json(subscription);
});

export const getPaymentMethods = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't access payment methods of other tenants.`);
  }

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  const customer = (await stripe.customers.retrieve(
    tenant.stripeCustomerId,
  )) as any;
  if (!customer) throw new BaseError(404, 'Stripe customer Not Found');

  const {data} = await stripe.paymentMethods.list({
    customer: tenant.stripeCustomerId,
    type: 'card',
  });

  if (!data) throw new BaseError(404, 'Payment Methods Not Found');

  const paymentMethods = data.map((paymentMethod) => {
    if (paymentMethod.id !== customer.invoice_settings.default_payment_method)
      return paymentMethod;
    return {is_default: true, ...paymentMethod};
  });

  res.status(200).json(paymentMethods);
});

export const postPaymentMethod = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;
  const {paymentMethod} = req.body;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't attach payment method to other tenants.`);
  }

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  const resp = await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: tenant.stripeCustomerId,
  });

  await stripe.customers.update(tenant.stripeCustomerId, {
    invoice_settings: {default_payment_method: paymentMethod.id},
  });

  res.status(201).json(resp);
});

export const deletePaymentMethod = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;
  const {paymentMethodId} = req.params;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't attach payment method to other tenants.`);
  }

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

  const {data} = await stripe.paymentMethods.list({
    customer: tenant.stripeCustomerId,
    type: 'card',
  });

  if (data.length) {
    await stripe.customers.update(tenant.stripeCustomerId, {
      invoice_settings: {default_payment_method: data[0].id},
    });
  }

  res.status(201).json(paymentMethod);
});

export const setDefaultPaymentMethod = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;
  const {paymentMethodId} = req.body;

  if (req.params.tenantId !== tenantId) {
    throw new BaseError(401, `Can't access payment methods of other tenants.`);
  }

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  const resp = await stripe.customers.update(tenant.stripeCustomerId, {
    invoice_settings: {default_payment_method: paymentMethodId},
  });

  res.status(200).json(resp);
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
