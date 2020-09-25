import express from 'express';
import {
  postFormSubmission,
  updateFormSubmission,
  getFormSubmission,
} from './controller';
import {
  postFormSubmissionRules,
  updateFormSubmissionValidationRules,
} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.post('/', postFormSubmissionRules, validate, postFormSubmission);
router.put(
  '/:formSubmissionId',
  updateFormSubmissionValidationRules,
  validate,
  updateFormSubmission,
);
router.get('/:formId/:applicantId', getFormSubmission);

export {router as routes};
