import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'testUtils/fake';
import dataGenerator from 'testUtils/dataGenerator';
import {Applicant} from 'db/repos/applicants';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    getSignedUrlPromise: () => Promise.resolve(''),
  })),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET /applicants/:applicantId', () => {
    let applicant: Applicant;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      applicant = await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        form.formFields.map(({formFieldId}) => formFieldId),
      );
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get(`/applicants/${applicant.applicantId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns single applicant if exists', async () => {
      const res = await request(app)
        .get(`/applicants/${applicant.applicantId}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.applicantId).toBe(applicant.applicantId);
    });

    it('returns 404 if applicant does not exists', (done) => {
      request(app)
        .get(`/applicants/${random.uuid()}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('isloates tenant', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      const fieldIds = form.formFields.map(({formFieldId}) => formFieldId);
      const {applicantId} = await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        fieldIds,
      );

      await request(app)
        .get(`/applicants/${applicantId}`)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
