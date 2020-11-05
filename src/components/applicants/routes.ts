import express from 'express';
import {
  getApplicants,
  getApplicant,
  getReport,
  deleteApplicant,
  updateApplicant,
  getPdfReport,
} from './controller';
import {getApplicantsRules, validateGetReport} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', getApplicantsRules, validate, getApplicants);
router.get('/:applicantId', getApplicant);

router.use(requireAdmin);
router.get('/:applicantId/report', validateGetReport, validate, getReport);
router.get('/:applicantId/pdf-report', getPdfReport);
router.put('/:applicantId', updateApplicant);
router.delete('/:applicantId', deleteApplicant);

export {router as routes};
