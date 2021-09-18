import express from 'express';
import {retrieveRules, updateRules} from './validation';
import {validate, RouterFactory} from 'shared/infrastructure/http';
import {
  requireAdmin,
  requireAuth,
  requireSubscription,
} from 'shared/infrastructure/http';
import {initializeRepositories} from '../repositories';
import {MembersAdapter} from 'modules/members/application/membersAdapter';

export const MembersRouter: RouterFactory = (dbAccess) => {
  const db = initializeRepositories(dbAccess);
  const adapter = MembersAdapter(db);
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireSubscription);
  router.use(requireAdmin);
  router.post('/', retrieveRules, validate, adapter.create);
  router.get('/', adapter.list);
  router.put('/:username', updateRules, validate, adapter.update);
  router.delete('/:username', adapter.del);

  return router;
};
