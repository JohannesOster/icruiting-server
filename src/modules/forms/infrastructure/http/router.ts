import express from 'express';
import {ApplicantsAdapter, FormsAdapter} from 'modules/forms/application';
import {createRules, updateRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAdmin, requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';
import {RouterFactory} from 'shared/infrastructure';
import {initializeDb} from '../db';

export const FormsRouter: RouterFactory = (dbAccess) => {
  const db = initializeDb(dbAccess);
  const formsAdapter = FormsAdapter(db);
  const applicantsAdapter = ApplicantsAdapter(db);
  const router = express.Router();

  router.get('/:formId/html', formsAdapter.renderHTMLForm);
  router.post('/:formId/html', applicantsAdapter.create);

  router.use(requireAuth);
  router.use(requireSubscription);
  router.get('/', formsAdapter.list);
  router.get('/:formId', formsAdapter.retrieve);

  router.use(requireAdmin);
  router.post('/', createRules, validate, formsAdapter.create);
  router.get('/:formId/export', formsAdapter.exportForm);
  router.delete('/:formId', formsAdapter.del);
  router.put('/:formId', updateRules, validate, formsAdapter.update);

  return router;
};
