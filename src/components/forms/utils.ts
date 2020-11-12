import Stripe from 'stripe';
import db from 'db';
import {BaseError} from 'errorHandling';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const validateSubscription = async (tenantId: string) => {
  const tenant = await db.oneOrNone(
    'SELECT * FROM tenant WHERE tenant_id=${tenant_id}',
    {tenant_id: tenantId},
  );
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');

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
};
