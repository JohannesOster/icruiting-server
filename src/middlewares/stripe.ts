import {RequestHandler} from 'express';
import {BaseError, catchAsync} from 'errorHandling';
import db from 'db';

export const requireSubscription: RequestHandler = catchAsync(
  async (req, res, next) => {
    let tenantId;
    if (res.locals.user) tenantId = res.locals.user.tenantId;
    if (!tenantId) tenantId = req.params.tenantId;
    if (!tenantId) throw new BaseError(422, 'Missing tenant_id');

    const tenant = await db.tenants.find(tenantId);
    if (!tenant) throw new BaseError(404, 'Authorized tenant Not Found.');

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

    next();
  },
);
