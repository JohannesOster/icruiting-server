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
  describe('POST /jobs/:jobId/report', () => {
    let report: string[];
    beforeAll(async () => {
      const applicationForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      report = applicationForm.formFields.map(({id}) => id);
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

      const dbReport = await jobsRepo.retrieveReport(mockUser.tenantId, jobId);
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
