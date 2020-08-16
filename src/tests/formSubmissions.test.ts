import request from 'supertest';
import app from '../app';
import db from '../db';
import {endConnection, truncateAllTables} from '../db/utils';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertOrganization} from 'components/organizations';
import {insertJob} from '../db/jobs.db';
import {dbInsertApplicant} from 'components/applicants';
import fake from './fake';
import faker from 'faker';
import {TApplicant} from 'components/applicants';
import {TFormSubmission} from 'controllers/formSubmissions';
import {insertFormSubmission} from '../db/formSubmissions.db';

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
  await dbInsertOrganization(organization);

  const job = fake.job(mockUser.orgID);
  const {job_id} = await insertJob(job);
  jobId = job_id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('form-submissions', () => {
  describe('POST /form-submissions', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async (done) => {
      const promises = [];

      const fakeForm = fake.screeningForm(mockUser.orgID, jobId);
      promises.push(dbInsertForm(fakeForm));

      const fakeApplicant = fake.applicant(mockUser.orgID, jobId);
      promises.push(dbInsertApplicant(fakeApplicant));

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
        .post('/form-submissions')
        .set('Accept', 'application/json')
        .send(formSubmission)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns form_submission entity', async () => {
      const resp = await request(app)
        .post('/form-submissions')
        .set('Accept', 'application/json')
        .send(formSubmission);

      expect(resp.body.form_id).toBe(formSubmission.form_id);
      expect(resp.body.applicant_id).toBe(formSubmission.applicant_id);
      expect(resp.body.submitter_id).toBe(formSubmission.submitter_id);
      expect(resp.body.comment).toBe(formSubmission.comment);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });

  describe('PUT /form-submissions/:form_id/:applicant_id', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async (done) => {
      const promises = [];

      const fakeForm = fake.screeningForm(mockUser.orgID, jobId);
      promises.push(dbInsertForm(fakeForm));

      const fakeApplicant = fake.applicant(mockUser.orgID, jobId);
      promises.push(dbInsertApplicant(fakeApplicant));

      formSubmission = await Promise.all(promises).then((data) => {
        const [form, applicant] = data as [TForm, TApplicant];

        return {
          applicant_id: applicant.applicant_id!,
          organization_id: mockUser.orgID,
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

    it('Returns 201 json response', async (done) => {
      await insertFormSubmission(formSubmission);
      request(app)
        .put(
          `/form-submissions/${formSubmission.form_id}/${formSubmission.applicant_id}`,
        )
        .set('Accept', 'application/json')
        .send({})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated entity', async () => {
      await insertFormSubmission(formSubmission);
      const newVals = {comment: faker.random.words()};
      const resp = await request(app)
        .put(
          `/form-submissions/${formSubmission.form_id}/${formSubmission.applicant_id}`,
        )
        .set('Accept', 'application/json')
        .send(newVals)
        .expect(200);

      // make shure non passed properties stay unchanged
      expect(resp.body.form_id).toBe(formSubmission.form_id);
      expect(resp.body.applicant_id).toBe(formSubmission.applicant_id);
      expect(resp.body.submitter_id).toBe(formSubmission.submitter_id);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);

      // make shure comment is updated
      expect(resp.body.comment).toBe(newVals.comment);
    });
  });

  describe('GET /form-submissions/:form_id/:applicant_id', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async (done) => {
      const promises = [];

      const fakeForm = fake.screeningForm(mockUser.orgID, jobId);
      promises.push(dbInsertForm(fakeForm));

      const fakeApplicant = fake.applicant(mockUser.orgID, jobId);
      promises.push(dbInsertApplicant(fakeApplicant));

      formSubmission = await Promise.all(promises).then(async (data) => {
        const [form, applicant] = data as [TForm, TApplicant];

        const formSubmission = {
          applicant_id: applicant.applicant_id!,
          organization_id: mockUser.orgID,
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

        return await insertFormSubmission(formSubmission);
      });

      done();
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(
          `/form-submissions/${formSubmission.form_id}/${formSubmission.applicant_id}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns inserted screening', async (done) => {
      const resp = await request(app)
        .get(
          `/form-submissions/${formSubmission.form_id}/${formSubmission.applicant_id}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(resp.body).toStrictEqual(formSubmission);

      done();
    });
  });
});
