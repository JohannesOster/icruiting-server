import {catchAsync} from 'application/errorHandling';

export const requireSubscription = catchAsync((req, res, next) => {
  next();
});
