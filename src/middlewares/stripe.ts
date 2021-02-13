import {RequestHandler} from 'express';
import {BaseError, catchAsync} from 'errorHandling';
import db from 'infrastructure/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const requireSubscription: RequestHandler = catchAsync(
  async (req, res, next) => {
    console.log('gets called');
    let tenantId;
    if (req.user) tenantId = req.user.tenantId;
    if (!tenantId) tenantId = req.params.tenantId;
    if (!tenantId) throw new BaseError(422, 'Missing tenant_id');

    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Authorized tenant Not Found.');

    if (!tenant.stripeCustomerId)
      throw new BaseError(404, 'Stripe customer id not found');

    req.user.stripeCustomerId = tenant.stripeCustomerId;

    const subsCount = await Promise.all([
      stripe.subscriptions.list({
        customer: tenant.stripeCustomerId,
        status: 'active',
      }),
      stripe.subscriptions.list({
        customer: tenant.stripeCustomerId,
        status: 'trialing',
      }),
    ]).then(([active, trailing]) => {
      return active.data.length + trailing.data.length;
    });

    if (subsCount < 1) throw new BaseError(401, 'Subscription required');

    next();
  },
);
