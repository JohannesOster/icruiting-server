import {query} from 'express-validator';

export const validateGetApplicants = [query('job_id').optional().isUUID()];

export const validateGetReport = [
  query('form_category').isIn(['assessment', 'screening']),
];
