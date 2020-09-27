import {random} from 'faker';
import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';
import {EFormCategory, Form} from 'db/repos/forms';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
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
  describe('PUT /forms/:formId', () => {
    it('returns json 200 response', async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );
      await request(app)
        .put(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .send({...form})
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns updated form entity', async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );
      const updateVals = {...form};
      const placeholder = random.words();
      updateVals.formFields = updateVals.formFields.map((item) => ({
        ...item,
        placeholder,
      }));
      const resp = await request(app)
        .put(`/forms/${form.formId}`)
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
        EFormCategory.application,
      );
      const updateVals = {...form, formTitle: random.words()};
      const resp = await request(app)
        .put(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);
      expect(resp.body.formTitle).toBe(updateVals.formTitle);
    });
  });
});
