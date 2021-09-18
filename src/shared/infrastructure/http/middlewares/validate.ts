import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(422).json({statusCode: 422, errors: errors.array()});
};
