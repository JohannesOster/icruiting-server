import request from 'supertest';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
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
      request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send({jobTitle: 'Head of Marketing'})
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns created job', async () => {
      const jobTitle = 'Head of Marketing';
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send({jobTitle})
        .expect(201);

      expect(resp.body.jobTitle).toBe(jobTitle);
    });

    it('inserts job enitity', async () => {
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send({jobTitle: 'Head of Marketing'})
        .expect(201);

      const {jobId} = resp.body;
      const stmt = 'SELECT COUNT(*) FROM job WHERE job_id=$1';
      const {count} = await db.one(stmt, jobId);
      expect(parseInt(count, 10)).toBe(1);
    });
  });
});
