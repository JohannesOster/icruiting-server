import {BaseError, catchAsync} from 'application/errorHandling';
import db from 'infrastructure/db';
import payment from 'infrastructure/paymentService';

export const requireSubscription = catchAsync(async (req, res, next) => {
  let tenantId;
  if (req.user) tenantId = req.user.tenantId;
  if (!tenantId) tenantId = req.params.tenantId;
  if (!tenantId) throw new BaseError(422, 'Missing tenant_id');

  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Authorized tenant Not Found.');

  if (!tenant.stripeCustomerId)
    throw new BaseError(404, 'Stripe customer id not found');

  req.user.stripeCustomerId = tenant.stripeCustomerId;

  const subsCount = await payment.subscriptions
    .listActive(tenant.stripeCustomerId)
    .then((data) => data.length);

  if (subsCount < 1) throw new BaseError(401, 'Subscription required');

  next();
});
