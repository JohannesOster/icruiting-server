import {BaseError, catchAsync} from 'errorHandling';
import db from 'db';

export const requireStripeCustomerId = catchAsync(async (req, res, next) => {
  const {tenantId} = req.user;

  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  req.user.stripeCustomerId = tenant.stripeCustomerId;

  next();
});
