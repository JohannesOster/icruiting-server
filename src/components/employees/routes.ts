import express from 'express';
import {getEmployees, createEmployee} from './controller';
import {validateCreateEmployee} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get('/', getEmployees);
router.post('/', validateCreateEmployee, catchValidationErrors, createEmployee);

export {router as routes};
