import express from 'express';
import {
  getJobs,
  postJob,
  putJob,
  deleteJob,
  getJob,
  getApplicantReport,
  createApplicantReport,
  updateApplicantReport,
} from './controller';
import {
  postJobsRules,
  putJobRules,
  validateCreateApplicantReport,
} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', getJobs);
router.get('/:job_id', getJob);

router.use(requireAdmin);
router.post('/', postJobsRules, validate, postJob);
router.put('/:job_id', putJobRules, validate, putJob);
router.delete('/:job_id', deleteJob);

router.get('/:job_id/applicant-reports', getApplicantReport);
router.post(
  '/:job_id/applicant-reports',
  validateCreateApplicantReport,
  validate,
  createApplicantReport,
);

router.put(
  '/:job_id/applicant-reports/:applicant_report_id',
  validateCreateApplicantReport,
  validate,
  updateApplicantReport,
);

export {router as routes};
