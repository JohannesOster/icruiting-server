import express from 'express';
import {
  organizationsController,
  employeesController,
  jobsController,
  formsController,
  applicantsController,
  rankingsController,
  screeningsController,
  assessmentsController,
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
router.post(
  '/screenings',
  screeningsController.validateCreateScreening,
  screeningsController.insertScreening,
);
router.get('/screenings/:applicant_id', screeningsController.getScreening);
router.put('/screenings/:applicant_id', screeningsController.updateScreening);

router.post(
  '/assessments',
  assessmentsController.validateCreateAssessment,
  assessmentsController.insertAssessment,
);
router.get('/assessments/:applicant_id', assessmentsController.getAssessment);
router.put(
  '/assessments/:applicant_id',
  assessmentsController.updateAssessment,
);

router.get(
  '/applicants',
  applicantsController.validateGetApplicants,
  applicantsController.getApplicants,
);
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
  formsController.validateCreateForm,
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
