import {body} from 'express-validator';

export const validateCreateAssessment = [
  body('form_id').isUUID(),
  body('applicant_id').isUUID(),
  body('submission').exists(),
];
