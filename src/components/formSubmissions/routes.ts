import express from 'express';
import {
  postFormSubmission,
  putFormSubmission,
  getFormSubmission,
} from './controller';
import {postFormSubmissionRules, putFormSubmissionRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.post('/', postFormSubmissionRules, validate, postFormSubmission);
router.put(
  '/:formSubmissionId',
  putFormSubmissionRules,
  validate,
  putFormSubmission,
);
router.get('/:formId/:applicantId', getFormSubmission);

export {router as routes};
