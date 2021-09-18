import express from 'express';
import {retrieveRules, updateRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAdmin, requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';
import {RouterFactory} from 'shared/infrastructure';
import {MembersAdapter} from 'modules/members/application';

export const MembersRouter: RouterFactory = () => {
  const adapter = MembersAdapter();
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
