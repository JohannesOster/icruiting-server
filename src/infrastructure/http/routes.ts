import express from 'express';
import {routes as applicants} from 'components/applicants';
import {routes as forms} from 'components/forms';
import {routes as tenants} from 'components/tenants';
import {routes as jobs} from 'components/jobs';
import {routes as members} from 'components/members';
import {routes as formSubmissions} from 'components/formSubmissions';
import {routes as rankings} from 'components/rankings';
import {routes as stripe} from 'components/stripe';

const router = express.Router();

router.use('/tenants', tenants);
router.use('/members', members);
router.use('/stripe', stripe);
router.use('/jobs', jobs);
router.use('/forms', forms);
router.use('/form-submissions', formSubmissions);
router.use('/applicants', applicants);
router.use('/rankings', rankings);

export {router as routes};
