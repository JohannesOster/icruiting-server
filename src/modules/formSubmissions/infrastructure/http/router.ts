import express from 'express';
import {createRules, updateRules, exportRules} from './validation';
import {
  validate,
  requireAuth,
  requireSubscription,
} from 'shared/infrastructure/http';
import {RouterFactory} from 'shared/infrastructure/http';
import {initializeRepositories} from '../repositories';
import {FormSubmissionsAdapter} from 'modules/formSubmissions/application';

export const FormSubmissionRouter: RouterFactory = (dbAccess) => {
  const db = initializeRepositories(dbAccess);
  const adapter = FormSubmissionsAdapter(db);
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireSubscription);
  router.post('/', createRules, validate, adapter.create);
  router.put('/:formSubmissionId', updateRules, validate, adapter.update);
  router.delete('/:formSubmissionId', adapter.del);
  router.get('/:formId/:applicantId', adapter.retrieve);
  router.get('/', exportRules, validate, adapter.exportFormSubmission);
  return router;
};
