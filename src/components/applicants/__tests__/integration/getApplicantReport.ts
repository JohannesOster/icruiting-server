import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import {TApplicant} from '../../types';
import {TForm, EFormCategory} from 'components/forms';
import fake from 'tests/fake';
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
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET applicants/:applicantId/report', () => {
    let applicant: TApplicant;
    beforeEach(async () => {
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );

      applicant = await dataGenerator.insertApplicant(
        mockUser.tenantId,
        jobId,
        form.formFields.map(({formFieldId}) => formFieldId),
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
