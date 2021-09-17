import express from 'express';
import {routes as applicants} from './applicants';
import {routes as rankings} from './rankings';
import {TenantsRouter} from 'modules/tenants/infrastructure/http';
import {FormsRouter} from 'modules/forms/infrastructure/http';
import db, {pgp} from 'infrastructure/db';
import {FormSubmissionRouter} from 'modules/formSubmissions/infrastructure/http';
import {MembersRouter} from 'modules/members/infrastructure/http';
import {SubscriptionsRouter} from 'modules/subscriptions/infrastructure/http';
import {JobsRouter} from 'modules/jobs/infrastructure/http';

const router = express.Router();

router.use('/tenants', TenantsRouter({db, pgp}));
router.use('/members', MembersRouter({db, pgp}));
router.use('/subscriptions', SubscriptionsRouter({db, pgp}));
router.use('/jobs', JobsRouter({db, pgp}));
router.use('/forms', FormsRouter({db, pgp}));
router.use('/form-submissions', FormSubmissionRouter({db, pgp}));
router.use('/applicants', applicants);
router.use('/rankings', rankings);

// This route exists for easier development of email .pug templates
router.get('/mail', (req, res, next) => {
  res.render('application-confirmation-email');
});

export {router as routes};
