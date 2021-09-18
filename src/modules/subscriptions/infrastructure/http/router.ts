import express from 'express';
import {RouterFactory} from 'shared/infrastructure';
import {SubscriptionsAdapter} from '../../application';

export const SubscriptionsRouter: RouterFactory = (dbAccess) => {
  const adapter = SubscriptionsAdapter();
  const router = express.Router();

  router.get('/', adapter.list);

  return router;
};
