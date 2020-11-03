import express from 'express';
import {
  createTenant,
  deleteTenant,
  getSubscriptions,
  getPaymentMethods,
  postPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from './controller';
import {createTenantRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.post('/', createTenantRules, validate, createTenant);

router.use(requireAuth);
router.use(requireAdmin);
router.get('/:tenantId/subscriptions', getSubscriptions);
router.get('/:tenantId/paymentMethods', getPaymentMethods);
router.post('/:tenantId/paymentMethods', postPaymentMethod);
router.post('/:tenantId/paymentMethods/default', setDefaultPaymentMethod);
router.delete(
  '/:tenantId/paymentMethods/:paymentMethodId',
  deletePaymentMethod,
);
router.delete('/', deleteTenant);

export {router as routes};
