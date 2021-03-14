import {BaseError} from 'application/errorHandling';
import db from 'infrastructure/db';
import paymentService from 'infrastructure/paymentService';
import {catchAsync} from '../httpReqHandler';

export const requireSubscription = catchAsync(async (req, res, next) => {
  let tenantId;
  if (req.user) tenantId = req.user.tenantId;
  if (!tenantId) tenantId = req.params.tenantId;
  if (!tenantId) throw new BaseError(422, 'Missing tenantId');

  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Authorized tenant Not Found.');

  if (!tenant.stripeCustomerId)
    throw new BaseError(404, 'Stripe customer id not found');

  req.user.stripeCustomerId = tenant.stripeCustomerId;

  const subsCount = await paymentService.subscriptions
    .listActive(tenant.stripeCustomerId)
    .then((data) => data.length);

  if (subsCount < 1) throw new BaseError(401, 'Subscription required');

  next();
});
