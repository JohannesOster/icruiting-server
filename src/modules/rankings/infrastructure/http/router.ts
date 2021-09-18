import express from 'express';
import {
  requireAuth,
  requireAdmin,
  requireSubscription,
  validate,
} from 'infrastructure/http/middlewares';
import {RouterFactory} from 'infrastructure/http';
import {initializeRepositories} from '../repositories';
import {RankingsAdapter} from 'modules/rankings/application/rankingsAdapter';
import {retrieveRules} from './validation';

export const RankingsRouter: RouterFactory = (dbAccess) => {
  const db = initializeRepositories(dbAccess);

  const adapter = RankingsAdapter(db);
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireSubscription);
  router.use(requireAdmin);
  router.get('/:jobId', retrieveRules, validate, adapter.retrieve);

  return router;
};
