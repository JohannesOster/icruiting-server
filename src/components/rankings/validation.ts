import {query} from 'express-validator';

export const validateRetrieve = [
  query('formCategory').isIn(['screening', 'assessment']),
];
