import {random} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Job} from 'infrastructure/db/repos/jobs';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
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
  describe('PUT /jobs/:jobId', () => {
    let job: Job;
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
      const updateValues = job;
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
      const sort = (a: any, b: any) =>
        a.requirementLabel > b.requirementLabel ? 1 : -1;
      expect(resp.body.jobRequirements.sort(sort)).toEqual(
        updateValues.jobRequirements.sort(sort),
      );
    });

    it('adds new requirement', async () => {
      const updateValues = job;
      updateValues.jobTitle = random.alphaNumeric();
      updateValues.jobRequirements = updateValues.jobRequirements.map(
        (req) => ({...req, requirementLabel: random.alphaNumeric()}),
      );

      (updateValues.jobRequirements as any[]).push({
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
