import express from 'express';
import * as controller from 'adapters/members/controller';
import {retrieveRules, updateRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAdmin, requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.use(requireAdmin);
router.post('/', retrieveRules, validate, controller.create);
router.get('/', controller.retrieve);
router.put('/:username', updateRules, validate, controller.update);

export {router as routes};
