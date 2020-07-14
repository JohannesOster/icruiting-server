import {query} from 'express-validator';

export const validateGetApplicants = [
  query('job_id').optional().isUUID(),
  query('group_by').optional().isString(),
  query('order_by').optional().isString(),
  query('offset').optional().isInt(),
  query('limit').optional().isInt(),
];
