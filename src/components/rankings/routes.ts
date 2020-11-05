import express from 'express';
import {getRanking} from './controller';
import {validateGetRanking} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';
import {requireSubscription} from 'middlewares/stripe';

const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.use(requireAdmin);
router.get('/:jobId', validateGetRanking, validate, getRanking);

export {router as routes};
