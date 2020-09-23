import {body} from 'express-validator';

export const validateCreateJob = [
  body('job_title').exists().isString(),
  body('job_requirements').exists(),
];

export const validateCreateApplicantReport = [
  body('image').optional().isUUID(),
  body('attributes').exists().isArray(),
  body('attributes[*]').isUUID(),
];
