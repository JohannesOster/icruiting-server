import express from 'express';
import {
  RouterFactory,
  requireAuth,
  requireAdmin,
  requireSubscription,
  validate,
} from 'shared/infrastructure/http';
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
