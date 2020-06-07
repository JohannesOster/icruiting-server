import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {insertForm, selectForms, selectForm} from '../../db/forms.db';

export const createForm: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  insertForm({...req.body, organization_id: res.locals.user.orgID})
    .then((data) => {
      res.status(201).json(data);
    })
    .catch((err) => {
      console.log(err);
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

export const renderHTMLForm: RequestHandler = (req, res, next) => {
  selectForm(req.params.form_id)
    .then((result) => {
      if (!result.length) return res.sendStatus(404);
      const form = result[0];
      const currUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      res.header('Content-Type', 'text/html');
      res.render('form', {
        formID: form.form_id,
        formItems: form.form_items,
        submitAction: currUrl,
      });
    })
    .catch(next);
};

export const submitHTMLForm: RequestHandler = (req, res, next) => {
  res.header('Content-Type', 'text/html');
  res.render('form-submission', {});
};
