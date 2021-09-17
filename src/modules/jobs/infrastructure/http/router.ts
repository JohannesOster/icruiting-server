import express from 'express';
import {
  requireAuth,
  requireAdmin,
  requireSubscription,
  validate,
} from 'infrastructure/http/middlewares';
import {RouterFactory} from 'infrastructure/http';
import {initializeRepositories} from '../repositories';
import {JobsAdapter} from 'modules/jobs/application';
import {createRules, updateRules, reportRules} from './validation';

export const JobsRouter: RouterFactory = (dbAccess) => {
  const db = initializeRepositories(dbAccess);

  const adapter = JobsAdapter(db);
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireSubscription);
  router.get('/', adapter.list);
  router.get('/:jobId', adapter.retrieve);

  router.use(requireAdmin);
  router.post('/', createRules, validate, adapter.create);
  router.put('/:jobId', updateRules, validate, adapter.update);
  router.delete('/:jobId', adapter.del);

  router.get('/:jobId/export', adapter.exportJob);
  router.post('/import', adapter.importJob);

  router.post('/:jobId/report', reportRules, validate, adapter.createReport);
  router.put('/:jobId/report', reportRules, validate, adapter.updateReport);
  router.get('/:jobId/report', adapter.retrieveReport);
  router.delete('/:jobId/report', adapter.delReport);

  return router;
};
