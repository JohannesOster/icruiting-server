import request from 'supertest';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Job} from 'modules/jobs/domain';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    deleteObjects: () => ({
      promise: () => Promise.resolve(),
    }),
  })),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('DELETE /jobs/:jobId', () => {
    let job: Job;
    beforeEach(async () => {
      job = await dataGenerator.insertJob(mockUser.tenantId);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes job entity', async () => {
      await request(app)
        .del(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const stmt = 'SELECT COUNT(*) FROM job WHERE job_id = $1';
      const {count} = await db.one(stmt, job.id);
      expect(parseInt(count, 10)).toBe(0);
    });
  });
});
