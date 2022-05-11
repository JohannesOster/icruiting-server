import {query} from 'express-validator';

export const listRules = [
  query('jobId').optional().isUUID(),
  query('offset').optional().isInt(),
  query('limit').optional().isInt(),
  query('orderBy').optional().isString(),
  query('filter').optional().isString(),
];

export const getReportRules = [
  query('formCategory').isIn(['assessment', 'screening', 'onboarding']),
];

export const getTEReportRules = [query('formId').isUUID()];
