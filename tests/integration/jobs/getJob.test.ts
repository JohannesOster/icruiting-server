import {random} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
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

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  let job: Job;
  beforeAll(async () => {
    job = await dataGenerator.insertJob(mockUser.tenantId);
  });

  describe('GET /jobs/:jobId', () => {
    it('Returns 200 json response', async () => {
      await request(app)
        .get(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns single job if exists', async () => {
      const resp = await request(app)
        .get(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.jobId).toEqual(job.id);
    });

    it('returns 404 if job does not exist', (done) => {
      request(app)
        .get(`/jobs/${random.uuid()}`)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('isolates tenant', async () => {
      const {id: tenantId} = await dataGenerator.insertTenant();
      const {id: jobId} = await dataGenerator.insertJob(tenantId);

      await request(app).get(`/jobs/${jobId}`).set('Accept', 'application/json').expect(404);
    });
  });
});
