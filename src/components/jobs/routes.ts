import express from 'express';
import * as controller from './controller';
import {updateRules, createRules} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

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
