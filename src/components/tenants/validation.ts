import {body} from 'express-validator';

export const createTenantRules = [body('tenantName').isString()];
