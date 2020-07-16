import {RequestHandler, ErrorRequestHandler} from 'express';

export const notFound: RequestHandler = (req, res, next) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
};

/* eslint-disable no-unused-vars */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log(err);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({message: err.message, stack: err.stack});
};
