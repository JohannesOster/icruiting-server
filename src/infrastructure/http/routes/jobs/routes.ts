import express from 'express';
import {JobsAdapter} from 'application/jobs/controller';
import {updateRules, createRules, reportRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAuth, requireAdmin} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const adapter = JobsAdapter();
const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', adapter.list);
router.get('/:jobId', adapter.retrieve);

router.use(requireAdmin);
router.post('/', createRules, validate, adapter.create);
router.put('/:jobId', updateRules, validate, adapter.update);
router.delete('/:jobId', adapter.del);

router.post('/:jobId/reports', reportRules, validate, adapter.createReport);
router.get('/:jobId/reports/:reportId', adapter.retrieveReport);
router.delete('/:jobId/reports/:reportId', adapter.delReport);

export {router as routes};
