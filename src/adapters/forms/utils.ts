import db from 'infrastructure/db';
import {BaseError} from 'adapters/errorHandling';
import payment from 'infrastructure/payment';

export const validateSubscription = async (tenantId: string) => {
  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(404, 'Stripe customer id not found');

  const subsCount = await payment.subscriptions
    .listActive(tenant.stripeCustomerId)
    .then((data) => data.length);

  if (subsCount < 1) throw new BaseError(401, 'Subscription required');
};
