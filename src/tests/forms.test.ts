import request from 'supertest';
import app from '../app';
import db from '../db';
import {endConnection, truncateAllTables} from '../db/utils';
import {insertForm} from '../db/forms.db';
import {insertOrganization} from '../db/organizations.db';
import {insertJob} from '../db/jobs.db';
import {insertApplicant} from '../db/applicants.db';
import {TForm, TFormSubmission} from 'controllers/forms';
import fake from './fake';
import faker from 'faker';
import {TApplicant} from 'controllers/applicants';

const mockUser = fake.user();
jest.mock('../middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async () => {
  const organization = fake.organization(mockUser.orgID);
  await insertOrganization(organization);

  const job = fake.job(mockUser.orgID);
  const {job_id} = await insertJob(job);
  jobId = job_id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('forms', () => {
  describe('POST /forms', () => {
    it('Returns 201 json response', (done) => {
      const form = fake.applicationForm(mockUser.orgID, jobId);

      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created form entity', async (done) => {
      const form = fake.applicationForm(mockUser.orgID, jobId);
      const resp = await request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect(201);

      expect(resp.body.form_id).not.toBeUndefined();
      expect(resp.body.form_category).toBe(form.form_category);
      expect(resp.body.form_items.length).toBe(form.form_items.length);
      done();
    });

    it('Validates req body', (done) => {
      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });

  describe('GET /forms', () => {
    beforeEach(async () => await db.none('TRUNCATE form CASCADE'));

    it('Returns 200 json response', (done) => {
      request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns array of forms', async (done) => {
      const promises = [
        insertForm(fake.applicationForm(mockUser.orgID, jobId)),
        insertForm(fake.screeningForm(mockUser.orgID, jobId)),
        insertForm(fake.assessmentForm(mockUser.orgID, jobId)),
        insertForm(fake.assessmentForm(mockUser.orgID, jobId)),
        insertForm(fake.assessmentForm(mockUser.orgID, jobId)),
      ];

      await Promise.all(promises);

      const resp = await request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.length).toBe(promises.length);
      done();
    });
  });

  describe('GET /forms/:form_id/html', () => {
    let form: TForm;
    beforeAll(async () => {
      const fakeForm = fake.screeningForm(mockUser.orgID, jobId);
      form = await insertForm(fakeForm);
    });

    it('Renders html without crashing', (done) => {
      request(app)
        .get(`/forms/${form.form_id}/html`)
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });
  });

  describe('DELETE /forms/:form_id', () => {
    let form: TForm;
    beforeEach(async () => {
      const fakeForm = fake.screeningForm(mockUser.orgID, jobId);
      form = await insertForm(fakeForm);
    });

    it('Returns json 200 response', (done) => {
      request(app)
        .delete(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Deletes form', async (done) => {
      const {count: countBefore} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.form_id,
      );

      expect(parseInt(countBefore)).toBe(1);

      await request(app)
        .delete(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.form_id,
      );

      expect(parseInt(count)).toBe(0);

      done();
    });
  });

  describe('PUT /forms/:form_id', () => {
    it('Returns json 200 response', async (done) => {
      const fakeForm = fake.applicationForm(mockUser.orgID, jobId);
      const form = await insertForm(fakeForm);

      request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send({})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated form entity', async (done) => {
      const fakeForm = fake.applicationForm(mockUser.orgID, jobId);
      const form: TForm = await insertForm(fakeForm);

      const updateVals = {...form};
      updateVals.form_items = updateVals.form_items.map((item) => ({
        ...item,
        placeholder: faker.random.words(),
      }));

      const resp = await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body).toStrictEqual(updateVals);

      done();
    });
  });

  describe('POST /forms/:form_id', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async (done) => {
      const promises = [];

      const fakeForm = fake.screeningForm(mockUser.orgID, jobId);
      promises.push(insertForm(fakeForm));

      const fakeApplicant = fake.applicant(mockUser.orgID, jobId);
      promises.push(insertApplicant(fakeApplicant));

      formSubmission = await Promise.all(promises).then((data) => {
        const [form, applicant] = data as [TForm, TApplicant];

        return {
          applicant_id: applicant.applicant_id!,
          submitter_id: mockUser.sub,
          form_id: form.form_id!,
          submission: form.form_items.reduce(
            (acc: {[form_item_id: string]: string}, item) => {
              acc[item.form_item_id!] = faker.random
                .number({min: 0, max: 5})
                .toString();
              return acc;
            },
            {},
          ),
          comment: faker.random.words(),
        };
      });

      done();
    });

    afterEach(async () => await db.none('TRUNCATE form_submission'));

    it('Returns 201 json response', (done) => {
      request(app)
        .post(`/forms/${formSubmission.form_id}`)
        .set('Accept', 'application/json')
        .send(formSubmission)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns form_submission entity', async () => {
      const resp = await request(app)
        .post(`/forms/${formSubmission.form_id}`)
        .set('Accept', 'application/json')
        .send(formSubmission);

      expect(resp.body.form_id).toBe(formSubmission.form_id);
      expect(resp.body.applicant_id).toBe(formSubmission.applicant_id);
      expect(resp.body.submitter_id).toBe(formSubmission.submitter_id);
      expect(resp.body.comment).toBe(formSubmission.comment);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });
});
