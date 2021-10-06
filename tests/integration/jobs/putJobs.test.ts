import {random} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Job} from 'modules/jobs/domain';
import jobRequirementsMapper from 'modules/jobs/mappers/jobRequirementsMapper';
import jobsMapper from 'modules/jobs/mappers/jobsMapper';

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
  describe('PUT /jobs/:id', () => {
    let job: Job;
    beforeEach(async () => {
      job = await dataGenerator.insertJob(mockUser.tenantId);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .put(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns updated entity', async () => {
      const updateValues = {...jobsMapper.toDTO(mockUser.tenantId, job)};
      updateValues.jobTitle = random.alphaNumeric();
      updateValues.jobRequirements = updateValues.jobRequirements.map(
        (req) => ({...req, requirementLabel: random.alphaNumeric()}),
      );

      updateValues.jobRequirements.shift(); // test if req gets removed

      const resp = await request(app)
        .put(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.jobTitle).toBe(updateValues.jobTitle);
      const sort = (a: any, b: any) =>
        a.requirementLabel > b.requirementLabel ? 1 : -1;

      const received = resp.body.jobRequirements.sort(sort);
      const expected = updateValues.jobRequirements.sort(sort);

      expect(received).toEqual(expected);
    });

    it('adds new requirement', async () => {
      const updateValues = {...jobsMapper.toDTO(mockUser.tenantId, job)};

      (updateValues.jobRequirements as any[]).push({
        requirementLabel: random.alphaNumeric(),
      });

      const resp = await request(app)
        .put(`/jobs/${job.id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.jobRequirements.length).toEqual(
        updateValues.jobRequirements.length,
      );
    });
  });
});
