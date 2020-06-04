import express from 'express';
import {
  organizationsController,
  employeesController,
  jobsController,
} from '../controllers';
import {requireAuth} from '../middlewares';

const router = express.Router();

router.post(
  '/organizations',
  organizationsController.validateCreateOrganization,
  organizationsController.createOrganization,
);

router.use(requireAuth);
router.get('/employees', employeesController.getEmployees);
router.post(
  '/employees',
  employeesController.validateCreateEmployee,
  employeesController.createEmployee,
);

router.post(
  '/jobs',
  jobsController.validateCreateJob,
  jobsController.createJob,
);
router.get('/jobs', jobsController.getJobs);

export {router as routes};
