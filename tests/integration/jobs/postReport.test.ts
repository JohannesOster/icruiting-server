import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import db from 'infrastructure/db';
import dataGenerator from '../testUtils/dataGenerator';
import {parse} from 'dotenv/types';

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
  describe('POST /jobs/:jobId/reports', () => {
    let report: any;
    beforeAll(async () => {
      const applicationForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      const formFields = applicationForm.formFields.map(
        ({formFieldId}) => formFieldId,
      );
      report = {jobId, formFields};
    });

    afterEach(async () => {
      await db.none('TRUNCATE report CASCADE');
    });

    it('returns 201 json response', (done) => {
      request(app)
        .post(`/jobs/${jobId}/reports`)
        .set('Accept', 'application/json')
        .send(report)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns inserted report', async () => {
      const resp = await request(app)
        .post(`/jobs/${jobId}/reports`)
        .set('Accept', 'application/json')
        .send(report)
        .expect(201);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM report WHERE report_id=$1',
        resp.body.reportId,
      );

      expect(parseInt(count, 10)).toBe(1);
      expect(resp.body.formFields.length).toBe(report.formFields.length);
    });
  });
});
