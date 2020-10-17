import {query} from 'express-validator';

export const getApplicantsRules = [
  query('jobId').optional().isUUID(),
  query('offset').optional().isInt(),
  query('limit').optional().isInt(),
  query('orderBy').optional().isString(),
  query('filter').optional().isString()
];

export const validateGetReport = [
  query('formCategory').isIn(['assessment', 'screening']),
];
