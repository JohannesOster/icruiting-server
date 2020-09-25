import {body} from 'express-validator';

export const postFormSubmissionRules = [
  body('formId').isUUID(),
  body('applicantId').isUUID(),
  body('submission').exists(),
];

export const updateFormSubmissionValidationRules = [
  body('formId').isUUID(),
  body('applicantId').isUUID(),
  body('formSubmissionId').isUUID(),
  body('submission').exists(),
];
