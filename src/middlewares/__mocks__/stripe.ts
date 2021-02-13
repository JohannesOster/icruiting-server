import {catchAsync} from 'errorHandling';

export const requireSubscription = catchAsync(async (req, res, next) => {
  next();
});
