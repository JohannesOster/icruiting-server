import express from 'express';
import {getApplicants} from './controller';
import {validateGetApplicants} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.get('/', validateGetApplicants, catchValidationErrors, getApplicants);

export {router as routes};
