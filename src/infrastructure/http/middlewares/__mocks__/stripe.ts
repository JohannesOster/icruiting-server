import {catchAsync} from 'application/errorHandling';

export const requireSubscription = catchAsync(async (req, res, next) => {
  next();
});
