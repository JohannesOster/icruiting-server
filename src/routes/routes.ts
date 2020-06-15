import express from 'express';
import {
  organizationsController,
  employeesController,
  jobsController,
  formsController,
  applicantsController,
} from '../controllers';
import {requireAuth} from '../middlewares';

const router = express.Router();

router.post(
  '/organizations',
  organizationsController.validateCreateOrganization,
  organizationsController.createOrganization,
);

router.get('/forms/:form_id/html', formsController.renderHTMLForm);
router.post('/forms/:form_id/html', formsController.submitHTMLForm);

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
router.post('/forms/:form_id', formsController.submitForm);
router.delete('/forms/:form_id', formsController.deleteForm);
router.put('/forms/:form_id', formsController.updateForm);

router.get('/applicants', applicantsController.getApplicants);

export {router as routes};
