import {RequestHandler} from 'express';
import {catchAsync} from 'errorHandling';

export const requireSubscription: RequestHandler = catchAsync(
  async (req, res, next) => {
    next();
  },
);
