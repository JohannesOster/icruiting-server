import express from 'express';
import {
  postForm,
  putForm,
  deleteForm,
  getForms,
  getForm,
  renderHTMLForm,
  submitHTMLForm,
  exportForm,
} from './controller';
import {postFormRules, putFormRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.get('/:formId/html', renderHTMLForm);
router.post('/:formId/html', submitHTMLForm);

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', getForms);
router.get('/:formId', getForm);

router.use(requireAdmin);
router.post('/', postFormRules, validate, postForm);
router.get('/:formId/export', exportForm);
router.delete('/:formId', deleteForm);
router.put('/:formId', putFormRules, validate, putForm);

export {router as routes};
