import {body} from 'express-validator';

export const validateCreateScreening = [
  body('form_id').isUUID(),
  body('applicant_id').isUUID(),
  body('values').exists(),
];
