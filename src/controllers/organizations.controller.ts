import {RequestHandler} from 'express';
import {insertProduct} from '../db/organizations.db';

export const createOrganization: RequestHandler = (req, res, next) => {
  const {organization_name} = req.body;
  insertProduct({organization_name})
    .then((resp: any) => {
      res.status(201).json({
        organization_id: resp.organization_id,
        organization_name,
      });
    })
    .catch((error: any) => {
      next(error);
    });
};
