import {body, query} from 'express-validator';

export const createRules = [
  body('formId').isUUID(),
  body('applicantId').isUUID(),
  body('submission').exists(),
];

export const updateRules = [
  body('formId').isUUID(),
  body('applicantId').isUUID(),
  body('formSubmissionId').isUUID(),
  body('submission').exists(),
];

export const exportRules = [
  query('jobId').isUUID(),
  query('formCategory').isIn(['screening', 'assessment', 'onboarding']),
];
