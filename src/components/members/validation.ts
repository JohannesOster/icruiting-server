import {body} from 'express-validator';

export const validateCreateMember = [
  body('emails').isArray({min: 1}),
  body('emails[*]').isString(),
];

export const validateUpdateMember = [
  body('user_role').isIn(['admin', 'member']),
];
