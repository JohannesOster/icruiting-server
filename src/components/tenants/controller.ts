import fs from 'fs';
import Stripe from 'stripe';
import {IncomingForm} from 'formidable';
import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import db from 'db';
import {BaseError, catchAsync} from 'errorHandling';
import {mapCognitoUser} from '../utils';
import {signUp} from './signUp';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const createTenant = catchAsync(async (req, res) => {
  const {tenantName, email, password, stripePriceId} = req.body;

  const {id} = await stripe.customers.create({email});
  const subscription = await stripe.subscriptions.create({
    customer: id,
    items: [{price: stripePriceId}],
    trial_period_days: 14,
  });
  const tenant = await db.tenants.insert({tenantName, stripeCustomerId: id});
  const {User} = await signUp({tenantId: tenant.tenantId, email, password});

  res.status(201).json({user: User, tenant, subscription});
});

export const getSubscriptions = catchAsync(async (req, res) => {
  const {stripeCustomerId} = res.locals.user;

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    expand: ['data.plan.product'],
  });

  res.status(200).json(subscriptions.data);
});

export const deleteSubscription = catchAsync(async (req, res) => {
  const {subscriptionId} = req.params;
  await stripe.subscriptions.del(subscriptionId);
  res.status(200).json({});
});

export const postSubscription = catchAsync(async (req, res) => {
  const {stripeCustomerId} = res.locals.user;
  const {priceId} = req.body;

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{price: priceId}],
  });

  res.status(200).json(subscription);
});

export const getSetupIntent = catchAsync(async (req, res) => {
  const {stripeCustomerId} = res.locals.user;

  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ['sepa_debit'],
    customer: stripeCustomerId,
  });

  res.status(200).json(setupIntent.client_secret);
});

export const getPaymentMethods = catchAsync(async (req, res) => {
  const {stripeCustomerId} = res.locals.user;

  const customer = (await stripe.customers.retrieve(stripeCustomerId)) as any;
  if (!customer) throw new BaseError(404, 'Stripe customer Not Found');

  const {data} = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: 'sepa_debit',
  });

  if (!data) throw new BaseError(404, 'Payment Methods Not Found');

  const paymentMethods = data.map((paymentMethod) => {
    if (paymentMethod.id !== customer.invoice_settings.default_payment_method)
      return paymentMethod;
    return {is_default: true, ...paymentMethod};
  });

  res.status(200).json(paymentMethods);
});

export const deletePaymentMethod = catchAsync(async (req, res) => {
  const {stripeCustomerId} = res.locals.user;
  const {paymentMethodId} = req.params;

  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

  const {data} = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: 'sepa_debit',
  });

  if (data.length) {
    const customer: any = await stripe.customers.retrieve(stripeCustomerId);

    if (!customer.invoice_settings.default_payment_method) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {default_payment_method: data[0].id},
      });
    }
  }

  res.status(201).json(paymentMethod);
});

export const setDefaultPaymentMethod = catchAsync(async (req, res) => {
  const {stripeCustomerId} = res.locals.user;
  const {paymentMethodId} = req.body;

  const resp = await stripe.customers.update(stripeCustomerId, {
    invoice_settings: {default_payment_method: paymentMethodId},
  });

  res.status(200).json(resp);
});

export const postTheme = catchAsync(async (req, res, next) => {
  const {tenantId} = res.locals.user;

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;

  const formidable = new IncomingForm();
  formidable.parse(req, async (error, fields, files) => {
    try {
      if (error) throw new BaseError(500, error);

      const file = files.theme;
      const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
      if (extension !== 'css')
        throw new BaseError(422, `Invalid fileformat ${extension}`);
      const fileId = (Math.random() * 1e32).toString(36);
      const fileKey = tenant.theme || tenantId + '.' + fileId + '.' + extension;
      const fileStream = fs.createReadStream(file.path);

      const params = {
        Key: fileKey,
        Bucket: bucket,
        ContentType: file.type,
        Body: fileStream,
      };
      await s3.upload(params).promise();

      if (!tenant.theme) await db.tenants.updateTheme(tenantId, fileKey);

      res.status(201).json({message: 'Successfully updated theme'});
    } catch (error) {
      next(error);
    }
  });
});

export const getTenant = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;

  let tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (tenant.theme) {
    const url = await new S3().getSignedUrlPromise('getObject', {
      Bucket: process.env.S3_BUCKET!,
      Key: tenant.theme,
      Expires: 100,
    });
    tenant = {...tenant, theme: url};
  }

  res.status(200).json(tenant);
});

export const deleteTheme = catchAsync(async (req, res) => {
  const {tenantId} = res.locals.user;

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.theme) throw new BaseError(404, 'Theme Not Found');

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;
  const delParams = {Bucket: bucket, Delete: {Objects: [{Key: tenant.theme!}]}};
  await s3.deleteObjects(delParams).promise();
  await db.tenants.updateTheme(tenantId, null);

  res.status(200).json();
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
