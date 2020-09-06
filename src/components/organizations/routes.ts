import express from 'express';
import {createOrganization, deleteOrganization} from './controller';
import {validateCreateOrganization} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.post(
  '/',
  validateCreateOrganization,
  catchValidationErrors,
  createOrganization,
);

router.use(requireAuth);
router.use(requireAdmin);
router.delete('/', deleteOrganization);

export {router as routes};
