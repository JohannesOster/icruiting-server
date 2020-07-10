import express from 'express';
import {
  organizationsController,
  employeesController,
  jobsController,
  formsController,
  applicantsController,
  rankingsController,
  screeningsController,
} from '../controllers';
import {requireAuth, requireAdmin} from '../middlewares';

const router = express.Router();

router.post(
  '/organizations',
  organizationsController.validateCreateOrganization,
  organizationsController.createOrganization,
);

router.get('/forms/:form_id/html', formsController.renderHTMLForm);
router.post('/forms/:form_id/html', formsController.submitHTMLForm);

router.use(requireAuth);
router.use(requireAdmin);
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
router.put('/jobs/:job_id', jobsController.updateJob);

router.post(
  '/forms',
  formsController.validateCreateForm,
  formsController.createForm,
);
router.get('/forms', formsController.getForms);
router.delete('/forms/:form_id', formsController.deleteForm);
router.put('/forms/:form_id', formsController.updateForm);

router.post(
  '/screenings',
  screeningsController.validateCreateScreening,
  screeningsController.insertScreening,
);
router.get('/screenings/:applicant_id', screeningsController.getScreening);
router.put('/screenings/:applicant_id', screeningsController.updateScreening);

router.get('/applicants', applicantsController.getApplicants);

router.get(
  '/rankings/:job_id',
  rankingsController.validateGetRanking,
  rankingsController.getRanking,
);

export {router as routes};
