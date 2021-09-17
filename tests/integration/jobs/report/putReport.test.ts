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
  jobId = job.id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('PUT /jobs/:jobId/report', () => {
    let report: any;
    let formFields: string[];
    beforeAll(async () => {
      const applicationForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      formFields = applicationForm.formFields.map(({id}) => id);
    });

    beforeEach(async () => {
      report = await db.jobs.createReport(mockUser.tenantId, jobId, formFields);
    });

    afterEach(async () => {
      await db.none('TRUNCATE report_field CASCADE');
    });

    it('returns 200 json response', (done) => {
      request(app)
        .put(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .send(formFields)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns updated report', async () => {
      const resp = await request(app)
        .put(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .send([formFields[0]])
        .expect(200);

      expect(resp.body.formFields.length).toBe(1);
      expect(resp.body.formFields[0]).toBe(formFields[0]);
    });
  });
});
