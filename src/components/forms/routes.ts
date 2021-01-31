import express from 'express';
import * as controller from './controller';
import {createRules, updateRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.get('/:formId/html', controller.renderHTMLForm);
router.post('/:formId/html', controller.submitHTMLForm);

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', controller.list);
router.get('/:formId', controller.retrieve);

router.use(requireAdmin);
router.post('/', createRules, validate, controller.create);
router.get('/:formId/export', controller.exportForm);
router.delete('/:formId', controller.del);
router.put('/:formId', updateRules, validate, controller.update);

export {router as routes};
