import express from 'express';
import {
  requireAuth,
  requireAdmin,
  requireSubscription,
  validate,
} from 'infrastructure/http/middlewares';
import {RouterFactory} from 'infrastructure/http';
import {initializeRepositories} from '../repositories';
import {ApplicantsAdapter} from '../../application';
import {listRules, getReportRules} from './validation';

export const ApplicantsRouter: RouterFactory = (dbAccess) => {
  const db = initializeRepositories(dbAccess);

  const adapter = ApplicantsAdapter(db);
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireSubscription);
  router.get('/', listRules, validate, adapter.list);
  router.get('/:applicantId', adapter.retrieve);

  router.use(requireAdmin);
  router.get(
    '/:applicantId/report',
    getReportRules,
    validate,
    adapter.getReport,
  );
  router.put('/:applicantId', adapter.update);
  router.delete('/:applicantId', adapter.del);
  router.put('/:applicantId/confirm', adapter.confirm);

  return router;
};
