import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {dbInsertOrganization} from './database';

export const createOrganization: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) res.status(422).json({errors: errors.array()});

  const {organization_name} = req.body;
  dbInsertOrganization({organization_name})
    .then((resp: any) => {
      res.status(201).json(resp);
    })
    .catch((error: any) => {
      next(error);
    });
};
