import {RequestHandler} from 'express';

export const requireAuth: RequestHandler = (req, res, next) => {
  res.locals.user = {orgID: process.env.TEST_ORG_ID};
  next();
};
