import {RequestHandler} from 'express';
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
  file?: {name: string; data: any};
};

export const httpReqHandler = (
  fn: (req: HTTPRequest) => Promise<HTTPResponse>,
): RequestHandler => {
  return async (req, res, next) => {
    await fn(req)
      .then((response) => {
        const {status, body, view, file} = response;
        if (view) return res.render(view, body);
        if (file) return res.attachment(file.name).send(file.data);
        res.status(status || 200).json(body);
      })
      .catch(next);
  };
};

export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (e) {
      next(e);
    }
  };
};
