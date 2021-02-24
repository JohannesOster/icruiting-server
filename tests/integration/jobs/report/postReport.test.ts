import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import db from 'infrastructure/db';
import dataGenerator from '../../testUtils/dataGenerator';

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
  const job = await dataGenerator.insertJob(mockUser.tenantId);
  jobId = job.jobId;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('POST /jobs/:jobId/report', () => {
    let report: string[];
    beforeAll(async () => {
      const applicationForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      report = applicationForm.formFields.map(({formFieldId}) => formFieldId);
    });

    afterEach(async () => {
      await db.none('TRUNCATE report_field CASCADE');
    });

    it('returns 201 json response', (done) => {
      request(app)
        .post(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .send(report)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns inserted report', async () => {
      const resp = await request(app)
        .post(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .send(report)
        .expect(201);

      const dbReport = await db.jobs.retrieveReport(mockUser.tenantId, jobId);
      expect(resp.body.formFields.length).toBe(dbReport.formFields.length);
      expect(resp.body.tenantId).toBe(dbReport.tenantId);
      expect(resp.body.jobId).toBe(dbReport.jobId);
    });

    it('returns 422 for empty formFields', (done) => {
      request(app)
        .post(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .send([])
        .expect(422, done);
    });
  });
});
