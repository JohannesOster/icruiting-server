import request from 'supertest';
import faker from 'faker';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import {TForm, EFormCategory} from 'components/forms';
import {TFormSubmission} from '../types';
import dataGenerator from 'tests/dataGenerator';

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
  await dataGenerator.insertTenant(mockUser.tenant_id);
  jobId = (await dataGenerator.insertJob(mockUser.tenant_id)).job_id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('form-submissions', () => {
  describe('POST /form-submissions', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async () => {
      const {tenant_id, user_id} = mockUser;
      const screeningForm: TForm = await dataGenerator.insertForm(
        tenant_id,
        jobId,
        EFormCategory.screening,
      );
      const applForm: TForm = await dataGenerator.insertForm(
        tenant_id,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = applForm.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const {applicant_id} = await dataGenerator.insertApplicant(
        tenant_id,
        jobId,
        formFieldIds,
      );

      formSubmission = {
        tenant_id,
        applicant_id,
        submitter_id: user_id,
        form_id: screeningForm.form_id!,
        submission: screeningForm.form_fields.reduce(
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

    afterEach(async () => await db.none('TRUNCATE form_submission CASCADE'));

    it('returns 201 json response', (done) => {
      request(app)
        .post('/form-submissions')
        .set('Accept', 'application/json')
        .send(formSubmission)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns form_submission entity', async () => {
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
    beforeAll(async () => {
      const {tenant_id, user_id} = mockUser;
      const screeningForm: TForm = await dataGenerator.insertForm(
        tenant_id,
        jobId,
        EFormCategory.screening,
      );
      const applForm: TForm = await dataGenerator.insertForm(
        tenant_id,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = applForm.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const {applicant_id} = await dataGenerator.insertApplicant(
        tenant_id,
        jobId,
        formFieldIds,
      );

      formSubmission = await dataGenerator.insertFormSubmission(
        tenant_id,
        applicant_id,
        user_id,
        screeningForm.form_id,
        screeningForm.form_fields.map(({form_field_id}) => form_field_id),
      );
    });

    it('returns 201 json response', async (done) => {
      request(app)
        .put(`/form-submissions/${formSubmission.form_submission_id}`)
        .set('Accept', 'application/json')
        .send({...formSubmission})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns updated entity', async () => {
      const resp = await request(app)
        .put(`/form-submissions/${formSubmission.form_submission_id}`)
        .set('Accept', 'application/json')
        .send({...formSubmission})
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
    beforeAll(async () => {
      const {tenant_id, user_id} = mockUser;
      const screeningForm: TForm = await dataGenerator.insertForm(
        tenant_id,
        jobId,
        EFormCategory.screening,
      );
      const applForm: TForm = await dataGenerator.insertForm(
        tenant_id,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = applForm.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const {applicant_id} = await dataGenerator.insertApplicant(
        tenant_id,
        jobId,
        formFieldIds,
      );

      formSubmission = await dataGenerator.insertFormSubmission(
        tenant_id,
        applicant_id,
        user_id,
        screeningForm.form_id,
        screeningForm.form_fields.map(({form_field_id}) => form_field_id),
      );
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

    it('Returns inserted screening', async () => {
      const resp = await request(app)
        .get(
          `/form-submissions/${formSubmission.form_id}/${formSubmission.applicant_id}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(resp.body).toStrictEqual(formSubmission);
    });
  });
});
