import express from 'express';
import {
  createFormSubmission,
  updateFormSubmission,
  getFormSubmission,
} from './controller';
import {
  createFormSubmissionValidationRules,
  updateFormSubmissionValidationRules,
} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.post(
  '/',
  createFormSubmissionValidationRules,
  validate,
  createFormSubmission,
);
router.put(
  '/:formSubmissionId',
  updateFormSubmissionValidationRules,
  validate,
  updateFormSubmission,
);
router.get('/:formId/:applicantId', getFormSubmission);

export {router as routes};
