import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {insertForm, selectForms} from '../../db/forms.db';

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

export const getForms: RequestHandler = (req, res, next) => {
  selectForms(res.locals.user.orgID)
    .then((forms) => {
      res.status(200).json(forms);
    })
    .catch((err) => {
      console.log(err);

      next(err);
    });
};
