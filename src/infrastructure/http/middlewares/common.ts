import {RequestHandler, ErrorRequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {BaseError} from 'application';

export const notFound: RequestHandler = (req) => {
  throw new BaseError(404, `🔍 - Not Found - ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const isOK = res.statusCode === 200;
  // console.log(err);
  let statusCode = !isOK ? res.statusCode : err.statusCode || 500;
  if (statusCode === 500) console.log(err);
  res.status(statusCode).json({
    statusCode,
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' ? {stack: err.stack} : {}),
  });
};

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(422).json({statusCode: 422, errors: errors.array()});
};
