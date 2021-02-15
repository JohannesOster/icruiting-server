import db from 'infrastructure/db';
import {BaseError} from 'application/errorHandling';
import paymentService from 'infrastructure/paymentService';

export const validateSubscription = async (tenantId: string) => {
  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(404, 'Stripe customer id not found');

  const subsCount = await paymentService.subscriptions
    .listActive(tenant.stripeCustomerId)
    .then((data) => data.length);

  if (subsCount < 1) throw new BaseError(401, 'Subscription required');
};
