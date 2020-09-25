import request from 'supertest';
import {random} from 'faker';
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
    let applicants: TApplicant[];
    beforeAll(async () => {
      const {tenantId} = mockUser;
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
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

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(applicants.length);
      expect(res.body[0].applicantId).toBe(applicants[0].applicantId);
    });

    it('isloates applicants of tenant', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
      );
      const fieldIds = form.formFields.map(({formFieldId}) => formFieldId);
      await dataGenerator.insertApplicant(tenantId, jobId, fieldIds);

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(applicants.length);
      expect(res.body[0].applicantId).toBe(applicants[0].applicantId);
    });

    it('filters by jobId using query', async () => {
      const {jobId} = await dataGenerator.insertJob(mockUser.tenantId);
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
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

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].applicantId).toBe(applicant.applicantId);
    });

    it('isloates tenant applicants even if foreign jobId is queried', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const {jobId} = await dataGenerator.insertJob(tenantId);
      const form: TForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
      );
      const fieldIds = form.formFields.map(({formFieldId}) => formFieldId);
      await dataGenerator.insertApplicant(tenantId, jobId, fieldIds);

      const res = await request(app)
        .get('/applicants?jobId=' + jobId)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.length).toBe(0);
    });

    it('includes boolean weather screening exists or not', async () => {
      const {jobId, applicantId} = applicants[0];
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.screening,
      );

      await dataGenerator.insertFormSubmission(
        mockUser.tenantId,
        applicantId!,
        mockUser.userId,
        form.formId,
        form.formFields.map(({formFieldId}) => formFieldId),
      );

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      const filtered = res.body.filter((appl: any) => appl.screeningExists);
      expect(filtered.length).toBe(1);
      expect(filtered[0].applicantId).toBe(applicantId);
    });
  });
});
