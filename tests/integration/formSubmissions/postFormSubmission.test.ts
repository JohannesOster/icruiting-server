import request from 'supertest';
import faker from 'faker';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';

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
  describe('POST /form-submissions', () => {
    let formSubmission: any;
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

    afterEach(async () => await db.none('DELETE FROM form_submission'));

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

      expect(resp.body.formSubmissionId).toBeDefined();
      expect(resp.body.formId).toBe(formSubmission.formId);
      expect(resp.body.applicantId).toBe(formSubmission.applicantId);
      expect(resp.body.submitterId).toBe(formSubmission.submitterId);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });
});
