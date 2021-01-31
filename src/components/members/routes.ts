import express from 'express';
import * as controller from './controller';
import {validateRetrieve, validateUpdate} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.use(requireAdmin);
router.post('/', validateRetrieve, validate, controller.create);
router.get('/', controller.retrieve);
router.put('/:username', validateUpdate, validate, controller.update);

export {router as routes};
