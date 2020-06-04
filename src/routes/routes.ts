import express from 'express';
import {
  organizationsController,
  employeesController,
  jobsController,
  formsController,
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

router.post(
  '/forms',
  formsController.validateCreateForm,
  formsController.createForm,
);
router.get('/forms', formsController.getForms);

export {router as routes};
