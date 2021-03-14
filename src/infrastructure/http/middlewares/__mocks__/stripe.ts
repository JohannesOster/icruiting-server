import {catchAsync} from 'infrastructure/http/httpReqHandler';

export const requireSubscription = catchAsync((req, res, next) => {
  next();
});
