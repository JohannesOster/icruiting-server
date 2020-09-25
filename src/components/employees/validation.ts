import {body} from 'express-validator';

export const validateCreateEmployee = [
  body('emails').isArray({min: 1}),
  body('emails[*]').isString(),
];

export const validateUpdateEmployee = [
  body('userRole').isIn(['admin', 'employee']),
];
