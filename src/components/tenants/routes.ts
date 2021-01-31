import express from 'express';
import * as controller from './controller';
import {createTenantRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';
import {requireStripeCustomerId} from './middleware';
import {routes as themes} from './themes';
import {routes as subscriptions} from './subscriptions';
import {routes as paymentMethods} from './paymentMethods';

const router = express.Router();

router.post('/', createTenantRules, validate, controller.create);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/', controller.del);
router.get('/:tenantId', controller.retrieve);

router.use(requireStripeCustomerId);
router.use('/:tenantId/themes', themes);
router.use('/:tenantId/subscriptions', subscriptions);
router.use('/:tenantId/paymentMethods', paymentMethods);

export {router as routes};
