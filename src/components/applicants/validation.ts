import {query} from 'express-validator';

export const validateGetApplicants = [query('job_id').optional().isUUID()];
