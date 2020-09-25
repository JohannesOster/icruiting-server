import {body} from 'express-validator';

export const postJobsRules = [
  body('jobTitle').exists().isString(),
  body('jobRequirements').exists(),
];

export const putJobRules = [
  body('jobId').isUUID(),
  body('jobTitle').isString(),
  body('jobRequirements').exists(),
];

export const validateCreateApplicantReport = [
  body('image').optional().isUUID(),
  body('attributes').exists().isArray(),
  body('attributes[*]').isUUID(),
];
