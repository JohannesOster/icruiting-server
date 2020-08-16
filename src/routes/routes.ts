import express from 'express';
import {
  organizationsController,
  employeesController,
  jobsController,
  formsController,
  rankingsController,
  formSubmissionsController,
} from '../controllers';
import {requireAuth, requireAdmin, catchValidationErrors} from '../middlewares';
import {routes as applicants} from 'components/applicants';

const router = express.Router();

router.post(
  '/organizations',
  organizationsController.validateCreateOrganization,
  organizationsController.createOrganization,
);

router.get('/forms/:form_id/html', formsController.renderHTMLForm);
router.post('/forms/:form_id/html', formsController.submitHTMLForm);

router.use(requireAuth);
router.post(
  '/form-submissions',
  formSubmissionsController.createFormSubmissionValidationRules,
  catchValidationErrors,
  formSubmissionsController.createFormSubmission,
);
router.put(
  '/form-submissions/:form_id/:applicant_id',
  formSubmissionsController.updateFormSubmission,
);
router.get(
  '/form-submissions/:form_id/:applicant_id',
  formSubmissionsController.getFormSubmissions,
);

router.use('/applicants', applicants);

router.get('/jobs', jobsController.getJobs);
router.get('/forms', formsController.getForms);

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
router.put('/jobs/:job_id', jobsController.updateJob);

router.post(
  '/forms',
  formsController.createFormValidationRules,
  catchValidationErrors,
  formsController.createForm,
);
router.delete('/forms/:form_id', formsController.deleteForm);
router.put('/forms/:form_id', formsController.updateForm);

router.get(
  '/rankings/:job_id',
  rankingsController.validateGetRanking,
  rankingsController.getRanking,
);

export {router as routes};
