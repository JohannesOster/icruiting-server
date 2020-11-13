import {RequestHandler} from 'express';
import {BaseError, catchAsync} from 'errorHandling';
import db from 'db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const requireSubscription: RequestHandler = catchAsync(
  async (req, res, next) => {
    let tenantId;
    if (res.locals.user) tenantId = res.locals.user.tenantId;
    if (!tenantId) tenantId = req.params.tenantId;
    if (!tenantId) throw new BaseError(422, 'Missing tenant_id');

    const tenant = await db.tenants.find(tenantId);
    if (!tenant) throw new BaseError(404, 'Authorized tenant Not Found.');

    if (!tenant.stripeCustomerId)
      throw new BaseError(404, 'Stripe customer id not found');

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
