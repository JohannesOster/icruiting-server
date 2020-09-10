import express from 'express';
import {createOrganization, deleteOrganization} from './controller';
import {createOrganizationRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.post('/', createOrganizationRules, validate, createOrganization);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/', deleteOrganization);

export {router as routes};
