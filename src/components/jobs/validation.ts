import {body} from 'express-validator';

export const validateCreateJob = [
  body('job_title').exists().isString(),
  body('job_requirements').exists(),
];
