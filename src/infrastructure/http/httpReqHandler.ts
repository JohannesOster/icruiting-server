import {RequestHandler as ExpressRequestHandler} from 'express';
import {BaseError, ValidationError} from 'domain/entities/error';
import {BaseError as HTTPError} from 'application/errorHandling';
import {IncomingMessage} from 'http';

type HTTPRequest = {
  user: User;
  params: any;
  query: any;
  body: any;
  originalUrl: string;
} & IncomingMessage;

type HTTPResponse = {
  status?: number;
  body?: any;
  view?: string;
};

type RequestHandler = (req: HTTPRequest) => Promise<HTTPResponse>;
export const httpReqHandler = (fn: RequestHandler): ExpressRequestHandler => {
  return async (req, res, next) => {
    await fn(req)
      .then((response) => {
        const {status, body, view} = response;
        if (view) return res.render(view, body);
        res.status(status || 200).json(body);
      })
      .catch(next);
  };
};

export const catchAsync = (
  fn: ExpressRequestHandler,
): ExpressRequestHandler => {
  return (req, res, next) => {
    try {
      fn(req, res, next);
    } catch (e) {
      next(mapDomainErrors(e));
    }
  };
};

const mapDomainErrors = (error: BaseError) => {
  const map = {
    [typeof ValidationError]: new HTTPError(422, error.message),
  };
  return map[typeof error] || error;
};
