import express from 'express';
import {getRanking} from './controller';
import {validateGetRanking} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get('/:job_id', validateGetRanking, catchValidationErrors, getRanking);

export {router as routes};
