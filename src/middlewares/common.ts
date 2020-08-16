import {RequestHandler, ErrorRequestHandler} from 'express';
import {validationResult, matchedData} from 'express-validator';

export const notFound: RequestHandler = (req, res, next) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // console.log(err);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({message: err.message, stack: err.stack});
};

export const catchValidationErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  res.status(422).json({errors: errors.array()});
};
