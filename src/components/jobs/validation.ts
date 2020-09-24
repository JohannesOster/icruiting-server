import {body} from 'express-validator';

export const postJobsRules = [
  body('job_title').exists().isString(),
  body('job_requirements').exists(),
];

export const putJobRules = [
  body('job_id').isUUID(),
  body('job_title').isString(),
  body('job_requirements').exists(),
];

export const validateCreateApplicantReport = [
  body('image').optional().isUUID(),
  body('attributes').exists().isArray(),
  body('attributes[*]').isUUID(),
];
