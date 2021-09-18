import {catchAsync} from 'shared/infrastructure/http/httpReqHandler';

export const requireSubscription = catchAsync((req, res, next) => {
  next();
});
