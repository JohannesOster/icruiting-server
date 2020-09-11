import express from 'express';
import {getApplicants, getReport} from './controller';
import {validateGetApplicants, validateGetReport} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', validateGetApplicants, validate, getApplicants);
router.get('/:applicant_id/report', validateGetReport, validate, getReport);

export {router as routes};
