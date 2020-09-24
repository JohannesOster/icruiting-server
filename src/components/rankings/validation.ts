import {query} from 'express-validator';

export const validateGetRanking = [
  query('formCategory').isIn(['screening', 'assessment']),
];
