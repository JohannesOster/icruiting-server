import express from 'express';
import {
  getApplicants,
  getApplicant,
  getReport,
  deleteApplicant,
  updateApplicant,
  getPdfReport,
} from './controller';
import {validateGetApplicants, validateGetReport} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', validateGetApplicants, validate, getApplicants);
router.get('/:applicantId', getApplicant);

router.use(requireAdmin);
router.get('/:applicantId/report', validateGetReport, validate, getReport);
router.get('/:applicantId/pdf-report', getPdfReport);
router.put('/:applicantId', updateApplicant);
router.delete('/:applicantId', deleteApplicant);

export {router as routes};
