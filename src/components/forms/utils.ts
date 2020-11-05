import db from 'db';
import {BaseError} from 'errorHandling';

export const validateSubscription = async (tenantId: string) => {
  const tenant = await db.oneOrNone(
    'SELECT * FROM tenant WHERE tenant_id=${tenant_id}',
    {tenant_id: tenantId},
  );
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');

  const {stripeSubscriptionId, stripeSubscriptionStatus = ''} = tenant;
  if (!stripeSubscriptionId) {
    throw new BaseError(401, 'Subscription required');
  }

  if (!['active', 'trialing'].includes(stripeSubscriptionStatus)) {
    throw new BaseError(
      401,
      `Invalid subscription status ${stripeSubscriptionStatus}`,
    );
  }
};
