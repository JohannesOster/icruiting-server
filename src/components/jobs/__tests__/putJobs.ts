import {random} from 'faker';
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
  await dataGenerator.insertTenant(mockUser.tenant_id);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('PUT /jobs/:job_id', () => {
    let job: TJob;
    beforeEach(async () => {
      job = await dataGenerator.insertJob(mockUser.tenant_id);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns updated entity', async () => {
      const updateValues: TJob = job;
      updateValues.job_title = random.alphaNumeric();
      updateValues.job_requirements = updateValues.job_requirements.map(
        (req) => ({...req, requirement_label: random.alphaNumeric()}),
      );

      updateValues.job_requirements.shift(); // test if req gets removed

      const resp = await request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.job_title).toBe(updateValues.job_title);
      expect(resp.body.job_requirements).toEqual(updateValues.job_requirements);
    });

    it('adds new requirement', async () => {
      const updateValues = job;
      updateValues.job_title = random.alphaNumeric();
      updateValues.job_requirements = updateValues.job_requirements.map(
        (req) => ({...req, requirement_label: random.alphaNumeric()}),
      );

      updateValues.job_requirements.push({
        requirement_label: random.alphaNumeric(),
      });

      const resp = await request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.job_requirements.length).toEqual(
        updateValues.job_requirements.length,
      );
    });
  });
});
