import {random} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {Form} from 'modules/forms/domain';

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
  describe('PUT /forms/:formId', () => {
    it('returns json 200 response', async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      await request(app)
        .put(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .send({...form})
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns updated form entity', async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      const updateVals = {...form};
      const placeholder = random.words();
      updateVals.formFields = updateVals.formFields.map((item) => ({
        ...item,
        placeholder,
      }));
      const resp = await request(app)
        .put(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);
      (resp.body as Form).formFields.forEach((field) => {
        expect(field.placeholder).toBe(placeholder);
      });
    });

    it('updates formTitle', async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'assessment',
      );
      const updateVals = {...form, formTitle: random.words()};
      const resp = await request(app)
        .put(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);
      expect(resp.body.formTitle).toBe(updateVals.formTitle);
    });
  });
});
