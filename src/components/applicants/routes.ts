import express from 'express';
import {getApplicants} from './controller';
import {validateGetApplicants} from './validation';
import {catchValidationErrors} from 'middlewares/common';

const router = express.Router();

router.get('/', validateGetApplicants, catchValidationErrors, getApplicants);

export {router as routes};
