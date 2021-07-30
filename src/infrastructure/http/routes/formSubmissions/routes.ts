import express from 'express';
import {FormSubmissionsAdapter} from 'application/formSubmissions/controller';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';
import {createRules, updateRules, exportRules} from './validation';

const adapter = FormSubmissionsAdapter();
const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.post('/', createRules, validate, adapter.create);
router.put('/:formSubmissionId', updateRules, validate, adapter.update);
router.delete('/:formSubmissionId', adapter.del);
router.get('/:formId/:applicantId', adapter.retrieve);
router.get('/', exportRules, validate, adapter.exportFormSubmission);

export {router as routes};
