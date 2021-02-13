import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
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
  describe('POST /forms', () => {
    it('returns 201 json response', (done) => {
      const form = fake.applicationForm(mockUser.tenantId, jobId);
      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns created form entity', async () => {
      const form = fake.applicationForm(mockUser.tenantId, jobId);
      const resp = await request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect(201);

      expect(resp.body.formId).not.toBeUndefined();
      expect(resp.body.formCategory).toBe(form.formCategory);
      expect(resp.body.formFields.length).toBe(form.formFields.length);
    });

    it('validates req body', (done) => {
      request(app)
        .post('/forms')
        .send({})
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });
});
