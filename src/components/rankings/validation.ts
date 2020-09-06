import {query} from 'express-validator';

export const validateGetRanking = [
  query('form_category').isIn(['screening', 'assessment']),
];
