import {RequestHandler, ErrorRequestHandler} from 'express';
import {BaseError} from 'application';
import {errorHandler as _errorHandler} from 'shared/infrastructure/errorHandler';

export const notFound: RequestHandler = (req) => {
  throw new BaseError(404, `🔍 - Not Found - ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  _errorHandler.handleError(err);
  let statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    statusCode,
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' ? {stack: err.stack} : {}),
  });
};
