import express from 'express';
import {getApplicants, getReport} from './controller';
import {validateGetApplicants, validateGetReport} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', validateGetApplicants, catchValidationErrors, getApplicants);
router.get(
  '/:applicant_id/report',
  validateGetReport,
  catchValidationErrors,
  getReport,
);

export {router as routes};
