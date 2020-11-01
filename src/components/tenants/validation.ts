import {body} from 'express-validator';

export const createTenantRules = [
  body('tenantName').isString(),
  body('name').isString(),
  body('email').isEmail(),
  body('password').isString(),
];
