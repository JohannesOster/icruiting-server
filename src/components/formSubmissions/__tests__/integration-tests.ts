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
  await dataGenerator.insertTenant(mockUser.tenantId);
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).jobId;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('form-submissions', () => {
  describe('POST /form-submissions', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async () => {
      const {tenantId, userId} = mockUser;
      const screeningForm: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.screening,
      );
      const applForm: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = applForm.formFields.map(
        ({formFieldId}) => formFieldId!,
      );

      const {applicantId} = await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        formFieldIds,
      );

      formSubmission = {
        tenantId,
        applicantId,
        submitterId: userId,
        formId: screeningForm.formId!,
        submission: screeningForm.formFields.reduce(
          (acc: {[formFieldId: string]: string}, item) => {
            acc[item.formFieldId!] = faker.random
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

      expect(resp.body.formId).toBe(formSubmission.formId);
      expect(resp.body.applicantId).toBe(formSubmission.applicantId);
      expect(resp.body.submitterId).toBe(formSubmission.submitterId);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });

  describe('PUT /form-submissions/:formId/:applicantId', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async () => {
      const {tenantId, userId} = mockUser;
      const screeningForm: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.screening,
      );
      const applForm: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = applForm.formFields.map(
        ({formFieldId}) => formFieldId!,
      );

      const {applicantId} = await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        formFieldIds,
      );

      formSubmission = await dataGenerator.insertFormSubmission(
        tenantId,
        applicantId,
        userId,
        screeningForm.formId,
        screeningForm.formFields.map(({formFieldId}) => formFieldId),
      );
    });

    it('returns 201 json response', async (done) => {
      request(app)
        .put(`/form-submissions/${formSubmission.formSubmissionId}`)
        .set('Accept', 'application/json')
        .send({...formSubmission})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns updated entity', async () => {
      const resp = await request(app)
        .put(`/form-submissions/${formSubmission.formSubmissionId}`)
        .set('Accept', 'application/json')
        .send({...formSubmission})
        .expect(200);

      // make shure non passed properties stay unchanged
      expect(resp.body.formId).toBe(formSubmission.formId);
      expect(resp.body.applicantId).toBe(formSubmission.applicantId);
      expect(resp.body.submitterId).toBe(formSubmission.submitterId);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });

  describe('GET /form-submissions/:formId/:applicantId', () => {
    let formSubmission: TFormSubmission;
    beforeAll(async () => {
      const {tenantId, userId} = mockUser;
      const screeningForm: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.screening,
      );
      const applForm: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = applForm.formFields.map(
        ({formFieldId}) => formFieldId!,
      );

      const {applicantId} = await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        formFieldIds,
      );

      formSubmission = await dataGenerator.insertFormSubmission(
        tenantId,
        applicantId,
        userId,
        screeningForm.formId,
        screeningForm.formFields.map(({formFieldId}) => formFieldId),
      );
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(
          `/form-submissions/${formSubmission.formId}/${formSubmission.applicantId}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns inserted screening', async () => {
      const resp = await request(app)
        .get(
          `/form-submissions/${formSubmission.formId}/${formSubmission.applicantId}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(resp.body).toStrictEqual(formSubmission);
    });
  });
});
