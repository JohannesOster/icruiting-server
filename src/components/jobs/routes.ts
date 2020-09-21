import express from 'express';
import {getJobs, createJob, updateJob, deleteJob, getJob} from './controller';
import {validateCreateJob} from './validation';
import {validate} from 'middlewares/common';
import {requireAuth, requireAdmin} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', getJobs);
router.get('/:job_id', getJob);

router.use(requireAdmin);
router.post('/', validateCreateJob, validate, createJob);
router.put('/:job_id', updateJob);
router.delete('/:job_id', deleteJob);

export {router as routes};
