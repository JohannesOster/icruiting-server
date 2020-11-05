import express from 'express';
import {
  getJobs,
  postJob,
  putJob,
  deleteJob,
  getJob,
  getApplicantReport,
  postApplicantReport,
  updateApplicantReport,
} from './controller';
import {
  postJobsRules,
  putJobRules,
  postApplicantReportRules,
} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', getJobs);
router.get('/:jobId', getJob);

router.use(requireAdmin);
router.post('/', postJobsRules, validate, postJob);
router.put('/:jobId', putJobRules, validate, putJob);
router.delete('/:jobId', deleteJob);

router.get('/:jobId/applicant-reports', getApplicantReport);
router.post(
  '/:jobId/applicant-reports',
  postApplicantReportRules,
  validate,
  postApplicantReport,
);
router.put(
  '/:jobId/applicant-reports/:applicantReportId',
  postApplicantReportRules,
  validate,
  updateApplicantReport,
);

export {router as routes};
