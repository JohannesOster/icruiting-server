import {body} from 'express-validator';

export const validateCreateEmployee = [body('email').exists().isEmail()];
