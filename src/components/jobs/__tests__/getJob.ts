import {random} from 'faker';
import request from 'supertest';
import app from 'app';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import {TJob} from '../types';
import dataGenerator from 'tests/dataGenerator';
import db from 'db';

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
  let job: TJob;
  beforeAll(async () => {
    job = await dataGenerator.insertJob(mockUser.tenant_id);
  });

  describe('GET /jobs/:job_id', () => {
    it('Returns 200 json response', async (done) => {
      request(app)
        .get(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('single job if exists', async () => {
      const resp = await request(app)
        .get(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.job_id).toEqual(job.job_id);
    });

    it('returns 404 if job does not exist', (done) => {
      request(app)
        .get(`/jobs/${random.uuid()}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('isolates tenant', async () => {
      const {tenant_id} = await dataGenerator.insertTenant();
      const {job_id} = await dataGenerator.insertJob(tenant_id);

      await request(app)
        .get(`/jobs/${job_id}`)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
