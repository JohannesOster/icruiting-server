import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {Applicant} from 'domain/entities';

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
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).id;
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
        form.formFields.map(({id}) => id),
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
        screeningForm.id,
        screeningForm.formFields.map(({id}) => id),
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
