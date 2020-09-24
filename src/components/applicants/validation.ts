import {query} from 'express-validator';

export const validateGetApplicants = [query('jobId').optional().isUUID()];

export const validateGetReport = [
  query('formCategory').isIn(['assessment', 'screening']),
];
