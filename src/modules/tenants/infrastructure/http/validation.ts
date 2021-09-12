import {body} from 'express-validator';

export const tenantCreateRules = [
  body('tenantName').isString(),
  body('email').isEmail(),
  body('password').isString(),
  body('stripePriceId').isString(),
];

export const subsCreateRules = [body('priceId').isString()];
