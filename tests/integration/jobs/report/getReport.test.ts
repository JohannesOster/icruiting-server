import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import db, {pgp} from 'infrastructure/db';
import dataGenerator from '../../testUtils/dataGenerator';
import {JobsRepository} from 'modules/jobs/infrastructure/repositories/jobsRepository';

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

const jobsRepo = JobsRepository({db, pgp});

describe('jobs', () => {
  describe('GET /jobs/:jobId/report', () => {
    let report: any;
    beforeAll(async () => {
      const applicationForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      const formFields = applicationForm.formFields.map(({id}) => id);
      report = await jobsRepo.createReport(
        mockUser.tenantId,
        jobId,
        formFields,
      );
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns report', async () => {
      const resp = await request(app)
        .get(`/jobs/${jobId}/report`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.reportId).toStrictEqual(report.reportId);
      expect(resp.body.formFields).toStrictEqual(report.formFields);
    });
  });
});
