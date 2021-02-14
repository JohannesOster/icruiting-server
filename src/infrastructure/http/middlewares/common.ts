import {RequestHandler, ErrorRequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {BaseError} from 'adapters/errorHandling';

export const notFound: RequestHandler = (req) => {
  throw new BaseError(404, `🔍 - Not Found - ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  if (err.statusCode) statusCode = err.statusCode;
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

// source: http://www.sheshbabu.com/posts/measuring-response-times-of-express-route-handlers/
export const monitor: RequestHandler = (req, res, next) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    // console.log('%s : %fms', req.path, elapsedTimeInMs);
  });

  next();
};
