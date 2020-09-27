import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';
import {Applicant} from 'db/repos/applicants';

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
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET applicants/:applicantId/report', () => {
    let applicant: Applicant;
    beforeEach(async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );

      applicant = await dataGenerator.insertApplicant(
        mockUser.tenantId,
        jobId,
        form.formFields.map(({formFieldId}) => formFieldId),
      );

      const screeningForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'screening',
      );

      await dataGenerator.insertFormSubmission(
        mockUser.tenantId,
        applicant.applicantId!,
        mockUser.userId,
        screeningForm.formId,
        screeningForm.formFields.map(({formFieldId}) => formFieldId),
      );
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get(
          `/applicants/${applicant.applicantId}/report?formCategory=screening`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('requires formCategory query', (done) => {
      request(app)
        .get(`/applicants/${applicant.applicantId}/report`)
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });
});
