import express from 'express';
import {
  createForm,
  updateForm,
  deleteForm,
  getForms,
  getForm,
  renderHTMLForm,
  submitHTMLForm,
} from './controller';
import {
  createFormValidationRules,
  updateFormValidationRules,
} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';

const router = express.Router();

router.get('/:formId/html', renderHTMLForm);
router.post('/:formId/html', submitHTMLForm);

router.use(requireAuth);
router.get('/', getForms);
router.get('/:formId', getForm);

router.use(requireAdmin);
router.post('/', createFormValidationRules, validate, createForm);
router.delete('/:formId', deleteForm);
router.put('/:formId', updateFormValidationRules, validate, updateForm);

export {router as routes};
