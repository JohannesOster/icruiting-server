import express from 'express';
import {routes as applicants} from 'components/applicants';
import {routes as forms} from 'components/forms';
import {routes as tenants} from 'components/tenants';
import {routes as jobs} from 'components/jobs';
import {routes as employees} from 'components/employees';
import {routes as formSubmissions} from 'components/formSubmissions';
import {routes as rankings} from 'components/rankings';

const router = express.Router();

router.use('/tenants', tenants);
router.use('/applicants', applicants);
router.use('/forms', forms);
router.use('/jobs', jobs);
router.use('/employees', employees);
router.use('/form-submissions', formSubmissions);
router.use('/rankings', rankings);

export {router as routes};
