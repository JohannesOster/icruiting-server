import express from 'express';
import {getEmployees, createEmployee, updateEmployee} from './controller';
import {validateCreateEmployee, validateUpdateEmployee} from './validation';
import {catchValidationErrors} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get('/', getEmployees);
router.post('/', validateCreateEmployee, catchValidationErrors, createEmployee);
router.put(
  '/:username',
  validateUpdateEmployee,
  catchValidationErrors,
  updateEmployee,
);

export {router as routes};
