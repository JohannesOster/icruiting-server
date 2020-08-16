import express from 'express';
import {createOrganization} from './controller';
import {validateCreateOrganization} from './validation';
import {catchValidationErrors} from 'middlewares/common';

const router = express.Router();

router.post(
  '/',
  validateCreateOrganization,
  catchValidationErrors,
  createOrganization,
);

export {router as routes};
