import express from 'express';
import {organizationsController, employeesController} from '../controllers';

const router = express.Router();

router.post(
  '/organizations',
  organizationsController.validateCreateOrganization,
  organizationsController.createOrganization,
);

router.post(
  '/employees',
  employeesController.validateCreateEmployee,
  employeesController.createEmployee,
);

export {router as routes};
