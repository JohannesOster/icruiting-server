import {RequestHandler as ExpressRequestHandler} from 'express';
import {BaseError as HTTPError} from 'application';
import {IncomingMessage} from 'http';
import {BaseError, ValidationError} from 'shared/domain/error';

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
  file?: Buffer;
};

type RequestHandler = (req: HTTPRequest) => Promise<HTTPResponse>;
export const httpReqHandler = (fn: RequestHandler): ExpressRequestHandler => {
  return async (req, res, next) => {
    await fn(req)
      .then((response) => {
        const {status, body, view, file} = response;
        if (view) return res.render(view, body);
        if (file) {
          res.set('Content-Type', 'application/octet-stream');
          res.set('Content-Length', `${file.length}`);
          return res.send(file);
        }
        res.status(status || 200).json(body);
      })
      .catch(next);
  };
};

export const catchAsync = (fn: ExpressRequestHandler): ExpressRequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((e: any) => {
      next(mapDomainErrors(e));
    });
  };
};

const mapDomainErrors = (error: BaseError) => {
  const map = {
    [typeof ValidationError]: new HTTPError(422, error.message),
  };
  return map[typeof error] || error;
};
