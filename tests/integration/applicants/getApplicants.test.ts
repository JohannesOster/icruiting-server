import request from 'supertest';
import {random} from 'faker';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {Applicant} from 'infrastructure/db/repos/applicants';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
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
  describe('GET /applicants', () => {
    let applicants: Applicant[];
    beforeAll(async () => {
      const {tenantId} = mockUser;
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      const applicant = await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        form.formFields.map(({formFieldId}) => formFieldId),
      );
      applicants = [applicant];
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns array of applicants', async () => {
      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body.applicants)).toBeTruthy();
      expect(res.body.applicants.length).toBe(applicants.length);
      expect(res.body.applicants[0].applicantId).toBe(
        applicants[0].applicantId,
      );
    });

    it('isloates applicants of tenant', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      const fieldIds = form.formFields.map(({formFieldId}) => formFieldId);
      await dataGenerator.insertApplicant(tenantId, jobId, fieldIds);

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.applicants.length).toBe(applicants.length);
    });

    it('filters by jobId using query', async () => {
      const {jobId} = await dataGenerator.insertJob(mockUser.tenantId);
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );

      const fieldIds = form.formFields.map(({formFieldId}) => formFieldId);
      const applicant = await dataGenerator.insertApplicant(
        mockUser.tenantId,
        jobId,
        fieldIds,
      );

      const res = await request(app)
        .get('/applicants?jobId=' + jobId)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.applicants.length).toBe(1);
      expect(res.body.applicants[0].applicantId).toBe(applicant.applicantId);
    });

    it('isloates tenant applicants even if foreign jobId is queried', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      const fieldIds = form.formFields.map(({formFieldId}) => formFieldId);
      await dataGenerator.insertApplicant(tenantId, jobId, fieldIds);

      const res = await request(app)
        .get('/applicants?jobId=' + jobId)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.applicants.length).toBe(0);
    });

    it('limits by limit query', async () => {
      const res = await request(app)
        .get(`/applicants?limit=${0}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.applicants.length).toBe(0);
    });
  });
});
