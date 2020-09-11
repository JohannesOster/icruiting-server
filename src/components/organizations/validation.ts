import {body} from 'express-validator';

export const createOrganizationRules = [body('organization_name').isString()];
