import db from 'infrastructure/db';
import {BaseError} from 'application';
import paymentService from 'shared/infrastructure/services/paymentService';

// TODO: should not access common db
export const validateSubscription = async (tenantId: string) => {
  const tenant = await db.oneOrNone('SELECT * FROM tenant WHERE tenant_id=$1', tenantId); // TODO: find better solution
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId) throw new BaseError(404, 'Stripe customer id not found');

  const subsCount = await paymentService.subscriptions
    .listActive(tenant.stripeCustomerId)
    .then((data) => data.length);

  if (subsCount < 1) throw new BaseError(401, 'Subscription required');
};
