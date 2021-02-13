import express from 'express';
import * as controller from 'adapters/formSubmissions/controller';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';
import {createRules, updateRules} from './validation';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.post('/', createRules, validate, controller.create);
router.put('/:formSubmissionId', updateRules, validate, controller.update);
router.get('/:formId/:applicantId', controller.retrieve);

export {router as routes};
