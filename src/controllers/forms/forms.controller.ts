import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {insertForm} from '../../db/forms.db';

export const createForm: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  insertForm({organization_id: res.locals.user.orgID, ...req.body})
    .then((data) => {
      res.status(201).json(data);
    })
    .catch((err) => {
      next(err);
    });
};
