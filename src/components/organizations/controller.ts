import {RequestHandler} from 'express';
import {dbInsertOrganization} from './database';

export const createOrganization: RequestHandler = (req, res, next) => {
  const {organization_name} = req.body;
  dbInsertOrganization({organization_name})
    .then((resp: any) => {
      res.status(201).json(resp);
    })
    .catch((error: any) => {
      next(error);
    });
};
