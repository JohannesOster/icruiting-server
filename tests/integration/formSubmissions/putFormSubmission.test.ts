import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {FormSubmission} from 'infrastructure/db/repos/formSubmissions';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
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
  describe('PUT /form-submissions/:formId/:applicantId', () => {
    let formSubmission: FormSubmission;
    beforeAll(async () => {
      const {tenantId, userId} = mockUser;
      const screeningForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'screening',
      );
      const applForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
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
});
