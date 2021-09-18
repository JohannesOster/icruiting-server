import {body} from 'express-validator';

export const retrieveRules = [
  body('emails').isArray({min: 1}),
  body('emails[*]').isString(),
];

export const updateRules = [body('user_role').isIn(['admin', 'member'])];
