import request from 'supertest';
import app from 'app';
import db from 'db';
import fake from 'testUtils/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import dataGenerator from 'testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('POST /jobs', () => {
    it('returns 201 json response', (done) => {
      const job = fake.job(mockUser.tenantId);
      request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns created job', async () => {
      const job = fake.job(mockUser.tenantId);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      expect(resp.body.jobTitle).toBe(job.jobTitle);

      // make shure all requirements are present in resp
      const respReqs = resp.body.jobRequirements;
      let count = 0; // count equalities
      job.jobRequirements.forEach((req) => {
        for (const {requirementLabel} of respReqs) {
          if (requirementLabel === req.requirementLabel) ++count;
        }
      });

      expect(count).toBe(job.jobRequirements.length);
    });

    it('inserts job enitity', async () => {
      const job = fake.job(mockUser.tenantId);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      const {jobId} = resp.body;
      const stmt = 'SELECT COUNT(*) FROM job WHERE job_id=$1';
      const {count} = await db.one(stmt, jobId);
      expect(parseInt(count, 10)).toBe(1);
    });

    it('inserts job_requirement enitities', async () => {
      const job = fake.job(mockUser.tenantId);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      const {jobId} = resp.body;
      const stmt = 'SELECT COUNT(*) FROM job_requirement WHERE job_id=$1';
      const {count} = await db.one(stmt, jobId);
      expect(parseInt(count, 10)).toBe(job.jobRequirements.length);
    });
  });
});
