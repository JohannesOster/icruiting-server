import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {random} from 'faker';
import {Form} from 'modules/forms/domain';
import {formsMapper} from 'modules/forms/mappers';
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
  describe('GET /forms/:formId', () => {
    let form: Form;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      form = await dataGenerator.insertForm(tenantId, jobId, 'application');
    });
    it('returns 200 json response', (done) => {
      request(app)
        .get(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns single form if exists', async () => {
      const resp = await request(app)
        .get(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body).toStrictEqual(formsMapper.toDTO(form));
    });

    it('returns 404 if form does not exist', async () => {
      await request(app)
        .get(`/forms/${random.uuid()}`)
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('isolates tenant', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );

      await request(app)
        .get(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .expect(404);
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
        .get(`/forms/${replica.id}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.formFields.sort()).toStrictEqual(
        primary.formFields
          .sort()
          .map((field) => formFieldsMapper.toDTO({formId: replica.id}, field)),
      );
    });
  });
});
