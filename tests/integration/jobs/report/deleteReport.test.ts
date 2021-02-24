import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import db from 'infrastructure/db';
import dataGenerator from '../../testUtils/dataGenerator';
import {Form} from 'domain/entities';

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
  describe('DELETE /jobs/:jobId/reports/:reportId', () => {
    let applicationForm: Form;
    beforeAll(async () => {
      applicationForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
    });

    let report: any;
    beforeEach(async () => {
      const formFields = applicationForm.formFields.map(
        ({formFieldId}) => formFieldId,
      );
      report = await db.jobs.createReport(mockUser.tenantId, jobId, formFields);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes report', async () => {
      await request(app)
        .del(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .expect(200);

      const report = await db.jobs.retrieveReport(mockUser.tenantId, jobId);
      expect(report).toBeNull();
    });
  });
});
