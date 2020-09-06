import express from 'express';
import {
  createFormSubmission,
  updateFormSubmission,
  getFormSubmission,
} from './controller';
import {createFormSubmissionValidationRules} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.post(
  '/',
  createFormSubmissionValidationRules,
  catchValidationErrors,
  createFormSubmission,
);
router.put('/:form_id/:applicant_id', updateFormSubmission);
router.get('/:form_id/:applicant_id', getFormSubmission);

export {router as routes};
