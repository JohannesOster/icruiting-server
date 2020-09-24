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
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  let job: TJob;
  beforeAll(async () => {
    job = await dataGenerator.insertJob(mockUser.tenantId);
  });

  describe('GET /jobs/:jobId', () => {
    it('Returns 200 json response', async (done) => {
      request(app)
        .get(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('single job if exists', async () => {
      const resp = await request(app)
        .get(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.jobId).toEqual(job.jobId);
    });

    it('returns 404 if job does not exist', (done) => {
      request(app)
        .get(`/jobs/${random.uuid()}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('isolates tenant', async () => {
      const {tenantId} = await dataGenerator.insertTenant();
      const {jobId} = await dataGenerator.insertJob(tenantId);

      await request(app)
        .get(`/jobs/${jobId}`)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
