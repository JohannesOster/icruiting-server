import {BaseError, catchAsync} from 'errorHandling';
import db from 'db';

export const requireStripeCustomerId = catchAsync(async (req, res, next) => {
  const {tenantId} = res.locals.user;

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.stripeCustomerId)
    throw new BaseError(500, 'Missing stripe customerId');

  res.locals.user.stripeCustomerId = tenant.stripeCustomerId;

  next();
});
