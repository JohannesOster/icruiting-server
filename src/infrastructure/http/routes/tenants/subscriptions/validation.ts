import {body} from 'express-validator';

export const createRules = [body('priceId').isString()];
