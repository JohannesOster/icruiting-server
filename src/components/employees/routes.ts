import express from 'express';
import {getEmployees, createEmployee, updateEmployee} from './controller';
import {validateCreateEmployee, validateUpdateEmployee} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get('/', getEmployees);
router.post('/', validateCreateEmployee, validate, createEmployee);
router.put('/:username', validateUpdateEmployee, validate, updateEmployee);

export {router as routes};
