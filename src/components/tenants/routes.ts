import express from 'express';
import {createTenant, deleteTenant, getSubscriptions} from './controller';
import {createTenantRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.post('/', createTenantRules, validate, createTenant);

router.use(requireAuth);
router.use(requireAdmin);
router.get('/:tenantId/subscriptions', getSubscriptions);
router.delete('/', deleteTenant);

export {router as routes};
