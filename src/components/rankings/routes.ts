import express from 'express';
import * as controller from './controller';
import {retrieveRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAdmin, requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.use(requireAdmin);
router.get('/:jobId', retrieveRules, validate, controller.retrieve);

export {router as routes};
