import express from 'express';
import {createTenant, deletetenant} from './controller';
import {createTenantRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.post('/', createTenantRules, validate, createTenant);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/', deletetenant);

export {router as routes};
