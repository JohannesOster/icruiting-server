import {body} from 'express-validator';

export const createFormSubmissionValidationRules = [
  body('form_id').isUUID(),
  body('applicant_id').isUUID(),
  body('submission').exists(),
];

export const updateFormSubmissionValidationRules = [
  body('form_id').isUUID(),
  body('applicant_id').isUUID(),
  body('form_submission_id').isUUID(),
  body('submission').exists(),
];
