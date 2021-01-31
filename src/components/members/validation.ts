import {body} from 'express-validator';

export const validateRetrieve = [
  body('emails').isArray({min: 1}),
  body('emails[*]').isString(),
];

export const validateUpdate = [body('user_role').isIn(['admin', 'member'])];
