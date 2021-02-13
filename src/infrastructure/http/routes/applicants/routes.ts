import express from 'express';
import * as controller from 'adapters/applicants/controller';
import {validate} from 'infrastructure/http/middlewares/common';
import {getReportRules, listRules} from './validation';
import {requireAuth, requireAdmin} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', listRules, validate, controller.list);
router.get('/:applicantId', controller.retrieve);

router.use(requireAdmin);
router.get(
  '/:applicantId/report',
  getReportRules,
  validate,
  controller.getReport,
);
router.put('/:applicantId', controller.update);
router.delete('/:applicantId', controller.del);

export {router as routes};
