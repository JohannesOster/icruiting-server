import {catchAsync} from 'infrastructure/http/errors';

export const requireSubscription = catchAsync(async (req, res, next) => {
  next();
});
