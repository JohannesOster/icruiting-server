import faker from 'faker';
import request from 'supertest';
import app from 'app';
import db from 'db';
import {dbInsertForm} from '../database';
import {TForm} from '../types';
import {endConnection, truncateAllTables} from 'db/utils';
import {dbInsertTenant} from 'components/tenants';
import {dbInsertJob} from 'components/jobs';
import fake from 'tests/fake';

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
  const tenant = fake.tenant(mockUser.tenant_id);
  await dbInsertTenant(tenant);

  const job = fake.job(mockUser.tenant_id);
  const {job_id} = await dbInsertJob(job);
  jobId = job_id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('forms', () => {
  describe('POST /forms', () => {
    it('Returns 201 json response', (done) => {
      const form = fake.applicationForm(mockUser.tenant_id, jobId);

      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created form entity', async (done) => {
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

    it('Validates req body', (done) => {
      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });

  describe('GET /forms', () => {
    beforeEach(async () => await db.none('TRUNCATE form CASCADE'));

    it('Returns 200 json response', (done) => {
      request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns array of forms', async (done) => {
      const promises = [
        dbInsertForm(fake.applicationForm(mockUser.tenant_id, jobId)),
        dbInsertForm(fake.screeningForm(mockUser.tenant_id, jobId)),
        dbInsertForm(fake.assessmentForm(mockUser.tenant_id, jobId)),
        dbInsertForm(fake.assessmentForm(mockUser.tenant_id, jobId)),
        dbInsertForm(fake.assessmentForm(mockUser.tenant_id, jobId)),
      ];

      await Promise.all(promises);

      const resp = await request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.length).toBe(promises.length);
      done();
    });
  });

  describe('GET /forms/:form_id/html', () => {
    let form: TForm;
    beforeAll(async () => {
      const fakeForm = fake.screeningForm(mockUser.tenant_id, jobId);
      form = await dbInsertForm(fakeForm);
    });

    it('Renders html without crashing', (done) => {
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
      const fakeForm = fake.screeningForm(mockUser.tenant_id, jobId);
      form = await dbInsertForm(fakeForm);
    });

    it('Returns json 200 response', (done) => {
      request(app)
        .delete(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Deletes form', async (done) => {
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

      done();
    });
  });

  describe('PUT /forms/:form_id', () => {
    it('Returns json 200 response', async (done) => {
      const fakeForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form = await dbInsertForm(fakeForm);

      request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send({})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated form entity', async (done) => {
      const fakeForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeForm);

      const updateVals = {...form};
      updateVals.form_fields = updateVals.form_fields.map((item) => ({
        ...item,
        placeholder: faker.random.words(),
        description: faker.random.words(),
      }));

      const resp = await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body).toStrictEqual(updateVals);

      done();
    });

    it('Updates form_title', async (done) => {
      const fakeForm = fake.assessmentForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeForm);

      const updateVals = {...form, form_title: faker.random.words()};
      const resp = await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body).toStrictEqual(updateVals);

      done();
    });
  });
});
