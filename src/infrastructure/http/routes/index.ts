import express from 'express';
import {routes as applicants} from './applicants';
import {routes as forms} from './forms';
import {routes as tenants} from './tenants';
import {routes as jobs} from './jobs';
import {routes as members} from './members';
import {routes as formSubmissions} from './formSubmissions';
import {routes as rankings} from './rankings';
import {routes as subscriptions} from './subscriptions';

const router = express.Router();

router.use('/tenants', tenants);
router.use('/members', members);
router.use('/subscriptions', subscriptions);
router.use('/jobs', jobs);
router.use('/forms', forms);
router.use('/form-submissions', formSubmissions);
router.use('/applicants', applicants);
router.use('/rankings', rankings);
router.get('/mail', (req, res, next) => {
  res.render('application-confirmation-email');
});

export {router as routes};
