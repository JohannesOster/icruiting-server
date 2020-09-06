import express from 'express';
import {getJobs, createJob, updateJob} from './controller';
import {validateCreateJob} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', getJobs);

router.use(requireAdmin);
router.post('/', validateCreateJob, catchValidationErrors, createJob);
router.put('/:job_id', updateJob);

export {router as routes};
