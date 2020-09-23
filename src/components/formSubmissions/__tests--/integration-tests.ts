import request from 'supertest';
import faker from 'faker';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/utils';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertTenant} from 'components/tenants';
import {dbInsertJob} from 'components/jobs';
import {dbInsertApplicant} from 'components/applicants';
import {TApplicant} from 'components/applicants';
import {TFormSubmission} from '../types';
import {dbInsertFormSubmission} from '../database';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async () => {
  const tenant = fake.tenant(mockUser.tenant_id);
  await dbInsertTenant(tenant);

  const job = fake.job(mockUser.tenant_id);
  const {job_id} = await dbInsertJob(job);
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

      const fakeForm = fake.screeningForm(mockUser.tenant_id, jobId);
      promises.push(dbInsertForm(fakeForm));

      const fakeApplForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeApplForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const fakeApplicant = fake.applicant(
        mockUser.tenant_id,
        jobId,
        formFieldIds,
      );
      promises.push(dbInsertApplicant(fakeApplicant));

      formSubmission = await Promise.all(promises).then((data) => {
        const [form, applicant] = data as [TForm, TApplicant];

        return {
          applicant_id: applicant.applicant_id!,
          submitter_id: mockUser.user_id,
          form_id: form.form_id!,
          submission: form.form_fields.reduce(
            (acc: {[form_field_id: string]: string}, item) => {
              acc[item.form_field_id!] = faker.random
                .number({min: 0, max: 5})
                .toString();
              return acc;
            },
            {},
          ),
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
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });

  describe('PUT /form-submissions/:form_id/:applicant_id', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async (done) => {
      const promises = [];

      const fakeForm = fake.screeningForm(mockUser.tenant_id, jobId);
      promises.push(dbInsertForm(fakeForm));

      const fakeApplForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeApplForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const fakeApplicant = fake.applicant(
        mockUser.tenant_id,
        jobId,
        formFieldIds,
      );
      promises.push(dbInsertApplicant(fakeApplicant));

      formSubmission = await Promise.all(promises).then((data) => {
        const [form, applicant] = data as [TForm, TApplicant];

        return {
          applicant_id: applicant.applicant_id!,
          tenant_id: mockUser.tenant_id,
          submitter_id: mockUser.user_id,
          form_id: form.form_id!,
          submission: form.form_fields.reduce(
            (acc: {[form_field_id: string]: string}, item) => {
              acc[item.form_field_id!] = faker.random
                .number({min: 0, max: 5})
                .toString();
              return acc;
            },
            {},
          ),
        };
      });

      done();
    });

    afterEach(async () => await db.none('TRUNCATE form_submission'));

    it('Returns 201 json response', async (done) => {
      await dbInsertFormSubmission(formSubmission);
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
      await dbInsertFormSubmission(formSubmission);
      const resp = await request(app)
        .put(
          `/form-submissions/${formSubmission.form_id}/${formSubmission.applicant_id}`,
        )
        .set('Accept', 'application/json')
        .send({})
        .expect(200);

      // make shure non passed properties stay unchanged
      expect(resp.body.form_id).toBe(formSubmission.form_id);
      expect(resp.body.applicant_id).toBe(formSubmission.applicant_id);
      expect(resp.body.submitter_id).toBe(formSubmission.submitter_id);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });

  describe('GET /form-submissions/:form_id/:applicant_id', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async (done) => {
      const promises = [];

      const fakeForm = fake.screeningForm(mockUser.tenant_id, jobId);
      promises.push(dbInsertForm(fakeForm));

      const fakeApplForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeApplForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const fakeApplicant = fake.applicant(
        mockUser.tenant_id,
        jobId,
        formFieldIds,
      );
      promises.push(dbInsertApplicant(fakeApplicant));

      formSubmission = await Promise.all(promises).then(async (data) => {
        const [form, applicant] = data as [TForm, TApplicant];

        const formSubmission = {
          applicant_id: applicant.applicant_id!,
          tenant_id: mockUser.tenant_id,
          submitter_id: mockUser.user_id,
          form_id: form.form_id!,
          submission: form.form_fields.reduce(
            (acc: {[form_field_id: string]: string}, item) => {
              acc[item.form_field_id!] = faker.random
                .number({min: 0, max: 5})
                .toString();
              return acc;
            },
            {},
          ),
        };

        return await dbInsertFormSubmission(formSubmission);
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
