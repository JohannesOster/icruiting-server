import {RequestHandler} from 'express';

export const requireAuth: RequestHandler = (req, res, next) => {
  console.log('TO BE IMPLEMENTED');
  next();
};
