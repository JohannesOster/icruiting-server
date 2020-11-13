import express from 'express';
import * as controller from './controller';
import {createTenantRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';
import {requireStripeCustomerId} from './middleware';

const router = express.Router();

router.post('/', createTenantRules, validate, controller.createTenant);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/', controller.deleteTenant);
router.get('/:tenantId', controller.getTenant);

router.use(requireStripeCustomerId);

router.post('/:tenantId/themes', controller.postTheme);
router.delete('/:tenantId/themes', controller.deleteTheme);

router.get('/:tenantId/subscriptions', controller.getSubscriptions);
router.post('/:tenantId/subscriptions', controller.postSubscription);
router.delete(
  '/:tenantId/subscriptions/:subscriptionId',
  controller.deleteSubscription,
);
router.get('/:tenantId/paymentMethods', controller.getPaymentMethods);
router.get('/:tenantId/paymentMethods/setupIntent', controller.getSetupIntent);
router.post(
  '/:tenantId/paymentMethods/default',
  controller.setDefaultPaymentMethod,
);
router.delete(
  '/:tenantId/paymentMethods/:paymentMethodId',
  controller.deletePaymentMethod,
);

export {router as routes};
