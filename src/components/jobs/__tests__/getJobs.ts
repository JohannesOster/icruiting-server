import faker from 'faker';
import request from 'supertest';
import app from 'app';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import {TJob} from '../types';
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
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  beforeAll(async () => {
    await dataGenerator.insertJob(mockUser.tenantId);
  });

  describe('GET /jobs', () => {
    it('returns 200 json response', async (done) => {
      request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns array of jobs', async () => {
      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);
      expect(Array.isArray(resp.body));
      expect(resp.body[0].jobId).toBeDefined();
      expect(resp.body[0].jobRequirements).toBeDefined();
    });

    it('orders jobs by created_at', async () => {
      const jobsCount = faker.random.number({min: 5, max: 20});
      const promises = Array(jobsCount)
        .fill(0)
        .map(() => dataGenerator.insertJob(mockUser.tenantId));
      await Promise.all(promises);

      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);

      for (let i = 0; i < jobsCount - 1; ++i) {
        const curr = new Date(resp.body[i].created_at);
        const following = new Date(resp.body[i + 1].created_at);
        expect(curr.valueOf()).toBeGreaterThanOrEqual(following.valueOf());
      }
    });

    it('isolates tenant jobs', async () => {
      const {tenantId} = await dataGenerator.insertTenant();
      await dataGenerator.insertJob(tenantId);

      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((job: TJob) =>
        expect(job.tenantId).toBe(mockUser.tenantId),
      );
    });
  });
});
