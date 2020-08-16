import {body} from 'express-validator';

export const validateCreateOrganization = [
  body('organization_name').exists().isString(),
];
