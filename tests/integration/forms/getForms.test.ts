import request from 'supertest';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).jobId;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('forms', () => {
  describe('GET /forms', () => {
    beforeEach(async () => await db.none('TRUNCATE form CASCADE'));

    it('returns 200 json response', (done) => {
      request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns array of forms', async () => {
      const {tenantId} = mockUser;
      const promises = [
        dataGenerator.insertForm(tenantId, jobId, 'application'),
        dataGenerator.insertForm(tenantId, jobId, 'screening'),
        dataGenerator.insertForm(tenantId, jobId, 'assessment'),
      ];
      await Promise.all(promises);

      const resp = await request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(resp.body)).toBeTruthy();
      expect(resp.body.length).toBe(promises.length);
      expect(resp.body[0].formId).toBeDefined();
    });
  });
});
