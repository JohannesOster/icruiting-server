import express from 'express';
import {TenantsAdapter} from 'adapters/tenants/tenants';
import {createRules} from './validation';
import {
  requireAuth,
  requireAdmin,
  requireSubscription,
  validate,
} from 'infrastructure/http/middlewares';
import {routes as themes} from './themes';
import {routes as subscriptions} from './subscriptions';
import {routes as paymentMethods} from './paymentMethods';

const adapter = TenantsAdapter();
const router = express.Router();

router.post('/', createRules, validate, adapter.create);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/:tenantId', adapter.del);
router.get('/:tenantId', adapter.retrieve);

router.use(requireSubscription);
router.use('/:tenantId/themes', themes);
router.use('/:tenantId/subscriptions', subscriptions);
router.use('/:tenantId/paymentMethods', paymentMethods);

export {router as routes};
