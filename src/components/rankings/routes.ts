import express from 'express';
import * as controller from './controller';
import {validateRetrieve} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.use(requireAdmin);
router.get('/:jobId', validateRetrieve, validate, controller.retrieve);

export {router as routes};
