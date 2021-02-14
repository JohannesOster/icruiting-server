import express from 'express';
import {FormsAdapter} from 'adapters/forms/controller';
import {createRules, updateRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAdmin, requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const adatper = FormsAdapter();
const router = express.Router();

router.get('/:formId/html', adatper.renderHTMLForm);
router.post('/:formId/html', adatper.submitHTMLForm);

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', adatper.list);
router.get('/:formId', adatper.retrieve);

router.use(requireAdmin);
router.post('/', createRules, validate, adatper.create);
router.get('/:formId/export', adatper.exportForm);
router.delete('/:formId', adatper.del);
router.put('/:formId', updateRules, validate, adatper.update);

export {router as routes};
