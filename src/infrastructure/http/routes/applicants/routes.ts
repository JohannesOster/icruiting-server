import express from 'express';
import {ApplicantsAdapter} from 'application/applicants/controller';
import {validate} from 'infrastructure/http/middlewares/common';
import {getReportRules, listRules} from './validation';
import {requireAuth, requireAdmin} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const adapter = ApplicantsAdapter();
const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', listRules, validate, adapter.list);
router.get('/:applicantId', adapter.retrieve);

router.use(requireAdmin);
router.get('/:applicantId/report', getReportRules, validate, adapter.getReport);
router.put('/:applicantId', adapter.update);
router.delete('/:applicantId', adapter.del);
router.put('/:applicantId/confirm', adapter.confirm);

export {router as routes};
