import request from 'supertest';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import dataGenerator from 'tests/dataGenerator';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenant_id);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('POST /jobs', () => {
    it('returns 201 json response', (done) => {
      const job = fake.job(mockUser.tenant_id);
      request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns created job', async () => {
      const job = fake.job(mockUser.tenant_id);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      expect(resp.body.job_title).toBe(job.job_title);

      // make shure all requirements are present in resp
      const respReqs = resp.body.job_requirements;
      let count = 0; // count equalities
      job.job_requirements.forEach((req) => {
        for (let i = 0; i < respReqs.length; ++i) {
          if (respReqs[i].requirement_label === req.requirement_label) ++count;
        }
      });

      expect(count).toBe(job.job_requirements.length);
    });

    it('inserts job enitity', async () => {
      const job = fake.job(mockUser.tenant_id);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      const {job_id} = resp.body;
      const stmt = 'SELECT COUNT(*) FROM job WHERE job_id=$1';
      const {count} = await db.one(stmt, job_id);
      expect(parseInt(count)).toBe(1);
    });

    it('inserts job_requirement enitities', async () => {
      const job = fake.job(mockUser.tenant_id);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      const {job_id} = resp.body;
      const stmt = 'SELECT COUNT(*) FROM job_requirement WHERE job_id=$1';
      const {count} = await db.one(stmt, job_id);
      expect(parseInt(count)).toBe(job.job_requirements.length);
    });
  });
});
