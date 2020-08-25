import {body} from 'express-validator';

export const validateCreateEmployee = [body('email').exists().isEmail()];
export const validateUpdateEmployee = [
  body('user_role').isIn(['admin', 'employee']),
];
