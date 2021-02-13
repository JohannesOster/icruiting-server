import express from 'express';
import * as controller from 'adapters/tenants/controller';
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

const router = express.Router();

router.post('/', createRules, validate, controller.create);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/:tenantId', controller.del);
router.get('/:tenantId', controller.retrieve);

router.use(requireSubscription);
router.use('/:tenantId/themes', themes);
router.use('/:tenantId/subscriptions', subscriptions);
router.use('/:tenantId/paymentMethods', paymentMethods);

export {router as routes};
