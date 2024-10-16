import express from 'express';
import {
  RouterFactory,
  requireAuth,
  requireAdmin,
  requireSubscription,
  validate,
} from 'shared/infrastructure/http';
import {initializeRepositories} from '../repositories';
import {ApplicantsAdapter} from '../../application';
import {listRules, getReportRules, getTEReportRules} from './validation';

export const ApplicantsRouter: RouterFactory = (dbAccess) => {
  const db = initializeRepositories(dbAccess);

  const adapter = ApplicantsAdapter(db);
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireSubscription);
  router.get('/', listRules, validate, adapter.list);
  router.get('/:applicantId', adapter.retrieve);

  router.use(requireAdmin);
  router.get('/:applicantId/report', getReportRules, validate, adapter.getReport);
  router.get('/:applicantId/report/pdf', getReportRules, validate, adapter.getPDFReport);
  router.get('/:applicantId/report/te', getTEReportRules, validate, adapter.getTEReport);

  router.put('/:applicantId', adapter.update);
  router.delete('/:applicantId', adapter.del);
  router.put('/:applicantId/confirm', adapter.confirm);

  return router;
};
