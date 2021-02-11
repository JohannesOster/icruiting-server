import {RequestHandler} from 'express';

export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    try {
      fn(req, res, next);
    } catch (e) {
      next(e);
    }
  };
};
