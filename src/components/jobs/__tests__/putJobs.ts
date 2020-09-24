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
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('PUT /jobs/:jobId', () => {
    let job: TJob;
    beforeEach(async () => {
      job = await dataGenerator.insertJob(mockUser.tenantId);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .put(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns updated entity', async () => {
      const updateValues: TJob = job;
      updateValues.jobTitle = random.alphaNumeric();
      updateValues.jobRequirements = updateValues.jobRequirements.map(
        (req) => ({...req, requirementLabel: random.alphaNumeric()}),
      );

      updateValues.jobRequirements.shift(); // test if req gets removed

      const resp = await request(app)
        .put(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.jobTitle).toBe(updateValues.jobTitle);
      expect(resp.body.jobRequirements).toEqual(updateValues.jobRequirements);
    });

    it('adds new requirement', async () => {
      const updateValues = job;
      updateValues.jobTitle = random.alphaNumeric();
      updateValues.jobRequirements = updateValues.jobRequirements.map(
        (req) => ({...req, requirementLabel: random.alphaNumeric()}),
      );

      updateValues.jobRequirements.push({
        requirementLabel: random.alphaNumeric(),
      });

      const resp = await request(app)
        .put(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.jobRequirements.length).toEqual(
        updateValues.jobRequirements.length,
      );
    });
  });
});
