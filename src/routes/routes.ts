import express from 'express';
import {
  employeesController,
  rankingsController,
  formSubmissionsController,
} from '../controllers';
import {requireAuth, requireAdmin, catchValidationErrors} from '../middlewares';
import {routes as applicants} from 'components/applicants';
import {routes as forms} from 'components/forms';
import {routes as organizations} from 'components/organizations';
import {routes as jobs} from 'components/jobs';

const router = express.Router();

router.use('/organizations', organizations);
router.use('/applicants', applicants);
router.use('/forms', forms);
router.use('/jobs', jobs);

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

router.use(requireAdmin);
router.get('/employees', employeesController.getEmployees);
router.post(
  '/employees',
  employeesController.validateCreateEmployee,
  employeesController.createEmployee,
);

router.get(
  '/rankings/:job_id',
  rankingsController.validateGetRanking,
  rankingsController.getRanking,
);

export {router as routes};
