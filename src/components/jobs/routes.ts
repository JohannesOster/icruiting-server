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
router.get('/:jobId', getJob);

router.use(requireAdmin);
router.post('/', postJobsRules, validate, postJob);
router.put('/:jobId', putJobRules, validate, putJob);
router.delete('/:jobId', deleteJob);

router.get('/:jobId/applicant-reports', getApplicantReport);
router.post(
  '/:jobId/applicant-reports',
  validateCreateApplicantReport,
  validate,
  createApplicantReport,
);

router.put(
  '/:jobId/applicant-reports/:applicantReportId',
  validateCreateApplicantReport,
  validate,
  updateApplicantReport,
);

export {router as routes};
