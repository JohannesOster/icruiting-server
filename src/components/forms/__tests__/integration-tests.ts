import faker from 'faker';
import request from 'supertest';
import app from 'app';
import db from 'db';
import {EFormCategory, TForm} from '../types';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';
import deepCleaner from 'deep-cleaner';

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
  await dataGenerator.insertTenant(mockUser.tenant_id);
  jobId = (await dataGenerator.insertJob(mockUser.tenant_id)).job_id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('forms', () => {
  describe('POST /forms', () => {
    it('returns 201 json response', (done) => {
      const form = fake.applicationForm(mockUser.tenant_id, jobId);

      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns created form entity', async (done) => {
      const form = fake.applicationForm(mockUser.tenant_id, jobId);
      const resp = await request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect(201);

      expect(resp.body.form_id).not.toBeUndefined();
      expect(resp.body.form_category).toBe(form.form_category);
      expect(resp.body.form_fields.length).toBe(form.form_fields.length);

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
      const {tenant_id} = mockUser;
      const promises = [
        dataGenerator.insertForm(tenant_id, jobId, EFormCategory.application),
        dataGenerator.insertForm(tenant_id, jobId, EFormCategory.screening),
        dataGenerator.insertForm(tenant_id, jobId, EFormCategory.assessment),
      ];
      await Promise.all(promises);

      const resp = await request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(resp.body)).toBeTruthy();
      expect(resp.body.length).toBe(promises.length);
      expect(resp.body[0].form_id).toBeDefined();
    });
  });

  describe('GET /forms/:form_id/html', () => {
    let form: TForm;
    beforeAll(async () => {
      form = await dataGenerator.insertForm(
        mockUser.tenant_id,
        jobId,
        EFormCategory.application,
      );
    });

    it('renders html without crashing', (done) => {
      request(app)
        .get(`/forms/${form.form_id}/html`)
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });
  });

  describe('DELETE /forms/:form_id', () => {
    let form: TForm;
    beforeEach(async () => {
      form = await dataGenerator.insertForm(
        mockUser.tenant_id,
        jobId,
        EFormCategory.application,
      );
    });

    it('returns json 200 response', (done) => {
      request(app)
        .delete(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes form', async () => {
      const {count: countBefore} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.form_id,
      );

      expect(parseInt(countBefore)).toBe(1);

      await request(app)
        .delete(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.form_id,
      );

      expect(parseInt(count)).toBe(0);
    });
  });

  describe('PUT /forms/:form_id', () => {
    it('returns json 200 response', async () => {
      const form = await dataGenerator.insertForm(
        mockUser.tenant_id,
        jobId,
        EFormCategory.application,
      );

      // remove null to pass express-validator
      deepCleaner(form);

      await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send({...form})
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns updated form entity', async () => {
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenant_id,
        jobId,
        EFormCategory.application,
      );

      // remove null to pass express-validator
      deepCleaner(form);

      const updateVals = {...form};
      const placeholder = faker.random.words();
      updateVals.form_fields = updateVals.form_fields.map((item) => ({
        ...item,
        placeholder,
      }));

      const resp = await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      (resp.body as TForm).form_fields.forEach((field) => {
        expect(field.placeholder).toBe(placeholder);
      });
    });

    it('updates form_title', async () => {
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenant_id,
        jobId,
        EFormCategory.application,
      );

      // remove null to pass express-validator
      deepCleaner(form);

      const updateVals = {...form, form_title: faker.random.words()};
      const resp = await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body.form_title).toBe(updateVals.form_title);
    });
  });
});
