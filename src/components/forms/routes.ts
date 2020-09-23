import express from 'express';
import {
  createForm,
  updateForm,
  deleteForm,
  getForms,
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

router.get('/:form_id/html', renderHTMLForm);
router.post('/:form_id/html', submitHTMLForm);

router.use(requireAuth);
router.get('/', getForms);

router.use(requireAdmin);
router.post('/', createFormValidationRules, validate, createForm);
router.delete('/:form_id', deleteForm);
router.put('/:form_id', updateFormValidationRules, validate, updateForm);

export {router as routes};
