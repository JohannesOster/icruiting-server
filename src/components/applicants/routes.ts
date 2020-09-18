import express from 'express';
import {
  getApplicants,
  getReport,
  deleteApplicant,
  updateApplicant,
} from './controller';
import {validateGetApplicants, validateGetReport} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', validateGetApplicants, validate, getApplicants);

router.use(requireAdmin);
router.get('/:applicant_id/report', validateGetReport, validate, getReport);
router.put('/:applicant_id', updateApplicant);
router.delete('/:applicant_id', deleteApplicant);

export {router as routes};
