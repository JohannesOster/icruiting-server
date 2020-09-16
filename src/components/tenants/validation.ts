import {body} from 'express-validator';

export const createTenantRules = [body('tenant_name').isString()];
