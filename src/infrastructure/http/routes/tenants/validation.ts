import {body} from 'express-validator';

export const createRules = [
  body('tenantName').isString(),
  body('email').isEmail(),
  body('password').isString(),
  body('stripePriceId').isString(),
];
