import request from 'supertest';
import app from 'app';
import db from 'db';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {Applicant} from 'db/repos/applicants';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    deleteObjects: () => ({promise: () => Promise.resolve()}),
  })),
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
  describe('DELETE /applicants/:applicantId', () => {
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
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/applicants/${applicant.applicantId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes applicant', async () => {
      await request(app)
        .del(`/applicants/${applicant.applicantId}`)
        .set('Accept', 'application/json');

      const stmt = 'SELECT COUNT(*) FROM applicant WHERE applicant_id = $1';
      const {count} = await db.one(stmt, applicant.applicantId);

      expect(parseInt(count, 10)).toBe(0);
    });
  });
});
