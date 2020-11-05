import {RequestHandler, ErrorRequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {BaseError} from 'errorHandling';

export const notFound: RequestHandler = (req, res) => {
  throw new BaseError(404, `🔍 - Not Found - ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // console.log(err);
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  if (err.statusCode) statusCode = err.statusCode;
  res.status(statusCode).json({
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' ? {stack: err.stack} : {}),
  });
};

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  res.status(422).json({errors: errors.array()});
};
