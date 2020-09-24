import faker from 'faker';
import request from 'supertest';
import app from 'app';
import db from 'db';
import {EFormCategory, TForm} from '../types';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';

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

    it('returns created form entity', async (done) => {
      const form = fake.applicationForm(mockUser.tenantId, jobId);
      const resp = await request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect(201);

      expect(resp.body.formId).not.toBeUndefined();
      expect(resp.body.formCategory).toBe(form.formCategory);
      expect(resp.body.formFields.length).toBe(form.formFields.length);

      done();
    });

    it('validates req body', (done) => {
      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });

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
        dataGenerator.insertForm(tenantId, jobId, EFormCategory.application),
        dataGenerator.insertForm(tenantId, jobId, EFormCategory.screening),
        dataGenerator.insertForm(tenantId, jobId, EFormCategory.assessment),
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

  describe('GET /forms/:formId/html', () => {
    let form: TForm;
    beforeAll(async () => {
      form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );
    });

    it('renders html without crashing', (done) => {
      request(app)
        .get(`/forms/${form.formId}/html`)
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });
  });

  describe('DELETE /forms/:formId', () => {
    let form: TForm;
    beforeEach(async () => {
      form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );
    });

    it('returns json 200 response', (done) => {
      request(app)
        .delete(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes form', async () => {
      const {count: countBefore} = await db.one(
        'SELECT COUNT(*) FROM form WHERE formId=$1',
        form.formId,
      );

      expect(parseInt(countBefore)).toBe(1);

      await request(app)
        .delete(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .expect(200);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM form WHERE formId=$1',
        form.formId,
      );

      expect(parseInt(count)).toBe(0);
    });
  });

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
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );

      const updateVals = {...form};
      const placeholder = faker.random.words();
      updateVals.formFields = updateVals.formFields.map((item) => ({
        ...item,
        placeholder,
      }));

      const resp = await request(app)
        .put(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      (resp.body as TForm).formFields.forEach((field) => {
        expect(field.placeholder).toBe(placeholder);
      });
    });

    it('updates formTitle', async () => {
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );

      const updateVals = {...form, formTitle: faker.random.words()};
      const resp = await request(app)
        .put(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body.formTitle).toBe(updateVals.formTitle);
    });
  });
});
