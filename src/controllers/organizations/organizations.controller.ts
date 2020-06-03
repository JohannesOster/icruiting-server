import {RequestHandler} from 'express';
import {insertProduct} from '../../db/organizations.db';
import {validationResult} from 'express-validator';

export const createOrganization: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

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
