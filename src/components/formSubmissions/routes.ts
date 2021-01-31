import express from 'express';
import * as controller from './controller';
import {validate} from 'middlewares/common';
import {requireAuth} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';
import {createRules, updateRules} from './validation';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.post('/', createRules, validate, controller.create);
router.put('/:formSubmissionId', updateRules, validate, controller.update);
router.get('/:formId/:applicantId', controller.retrieve);

export {router as routes};
