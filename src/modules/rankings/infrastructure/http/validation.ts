import {query} from 'express-validator';

export const retrieveRules = [
  query('formCategory').isIn(['screening', 'assessment', 'onboarding']),
];

export const retrieveTERules = [query('formId').isUUID()];
