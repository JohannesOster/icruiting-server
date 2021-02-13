import express from 'express';
import * as controller from 'components/jobs/controller';
import {updateRules, createRules} from 'components/jobs/validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAuth, requireAdmin} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.get('/', controller.list);
router.get('/:jobId', controller.retrieve);

router.use(requireAdmin);
router.post('/', createRules, validate, controller.create);
router.put('/:jobId', updateRules, validate, controller.update);
router.delete('/:jobId', controller.del);

export {router as routes};
