import {catchAsync} from 'adapters/errorHandling';

export const requireSubscription = catchAsync(async (req, res, next) => {
  next();
});
