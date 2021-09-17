import request from 'supertest';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {formFieldsMapper} from 'modules/forms/mappers/formFieldsMapper';

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
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).id;
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

    it('retrieves replica with formFields of primary form', async () => {
      const primary = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'onboarding',
      );

      const replica = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'onboarding',
        {replicaOf: primary.id},
      );

      const resp = await request(app)
        .get(`/forms`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(resp.body)).toBeTruthy();
      expect(resp.body.length).toBe(2);

      resp.body.forEach((form: any) => {
        const formId = form.formId === primary.id ? primary.id : replica.id;

        expect(form.formFields.sort()).toStrictEqual(
          primary.formFields
            .sort()
            .map((field) => formFieldsMapper.toDTO({formId}, field)),
        );
      });
    });
  });
});
