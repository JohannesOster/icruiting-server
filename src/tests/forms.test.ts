import request from 'supertest';
import app from '../app';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import db from '../db';
import {insertForm} from '../db/forms.db';
import fake from './fake';

jest.mock('../middlewares/auth');

let jobId: string;
beforeAll(async (done) => {
  await createAllTables();

  const insert = db.$config.pgp.helpers.insert;

  const organization = fake.organization(process.env.TEST_ORG_ID);
  const insOrg = insert(organization, null, 'organization');
  await db.none(insOrg);

  const job = fake.job(organization.organization_id);
  const params = {
    organization_id: job.organization_id,
    job_title: job.job_title,
  };

  const insJob = insert(params, null, 'job') + ' RETURNING *';
  const {job_id} = await db.one(insJob);

  const req = {job_id, ...job.job_requirements[0]};
  const insReq = insert(req, null, 'job_requirement');
  await db.none(insReq);

  jobId = job_id; // set jobId for "global" access in test file

  done();
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

describe('forms', () => {
  describe('POST /forms', () => {
    it('Returns 201 json response', (done) => {
      const orgId = process.env.TEST_ORG_ID || '';
      const form = fake.applicationForm(orgId, jobId);
      request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns application form entity as well as form items', async (done) => {
      const orgId = process.env.TEST_ORG_ID || '';
      const form = fake.applicationForm(orgId, jobId);
      const resp = await request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect(201);

      expect(!!resp.body.form_id).toBe(true);
      expect(resp.body.form_title).toBe(form.form_title);
      expect(resp.body.form_category).toBe(form.form_category);
      expect(resp.body.form_items.length).toBe(form.form_items.length);

      done();
    });

    it('Returns screening form entity as well as form items', async (done) => {
      const orgId = process.env.TEST_ORG_ID || '';
      const form = fake.screeningForm(orgId, jobId);
      const resp = await request(app)
        .post('/forms')
        .set('Accept', 'application/json')
        .send(form)
        .expect(201);

      expect(!!resp.body.form_id).toBe(true);
      expect(resp.body.form_title).toBe(form.form_title);
      expect(resp.body.form_category).toBe(form.form_category);
      expect(resp.body.form_items.length).toBe(form.form_items.length);
      done();
    });
  });

  describe('GET /forms', () => {
    beforeEach((done) => {
      db.none('DELETE FROM form').finally(done);
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns array of forms along with their form items', async (done) => {
      const orgId = process.env.TEST_ORG_ID || '';
      const fakeForm: any = fake.applicationForm(orgId, jobId);
      const form = await insertForm(fakeForm);

      const resp = await request(app)
        .get('/forms')
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body[0].form_id).toBe(form.form_id);
      expect(resp.body[0].form_items.length).toBe(form.form_items.length);

      done();
    });
  });

  describe('GET /forms/:form_id/html', () => {
    let form: any;
    beforeAll(async (done) => {
      await db.tx((t) =>
        t.batch([
          db.none('DELETE FROM form'),
          db.none('DELETE FROM applicant'),
        ]),
      );

      const orgId = process.env.TEST_ORG_ID || '';
      const fakeForm: any = fake.screeningForm(orgId, jobId);
      form = await insertForm(fakeForm);
      done();
    });

    it('Renders html without crashing', (done) => {
      request(app)
        .get(`/forms/${form.form_id}/html`)
        .set('Accept', 'text/html')
        .expect(200, done);
    });
  });

  describe('DELETE /forms/:form_id', () => {
    let form: any;
    beforeEach(async (done) => {
      await db.none('DELETE FROM form');
      const orgId = process.env.TEST_ORG_ID || '';
      const fakeForm: any = fake.screeningForm(orgId, jobId);
      form = await insertForm(fakeForm);
      done();
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
      const orgId = process.env.TEST_ORG_ID || '';
      const fakeForm: any = fake.applicationForm(orgId, jobId);
      const form = await insertForm(fakeForm);

      request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send({})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated form entity', async (done) => {
      const orgId = process.env.TEST_ORG_ID || '';
      const fakeForm: any = fake.applicationForm(orgId, jobId);
      const form = await insertForm(fakeForm);

      const updateVals: any = fake.applicationForm(orgId, jobId);
      const resp = await request(app)
        .put(`/forms/${form.form_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      // make shure form_id, organization_id and job_id are unmodified
      expect(resp.body.form_id).toBe(form.form_id);
      expect(resp.body.organization_id).toBe(form.organization_id);
      expect(resp.body.job_id).toBe(form.job_id);

      expect(resp.body.form_title).toBe(updateVals.form_title);

      /*
       * for each received form item
       *    go through all sent form_items to find the corresponding one
       *        for this item go through all object keys and compare them to response item
       */
      resp.body.form_items.forEach((item: any) => {
        for (let i = 0; i < updateVals.form_items.length; ++i) {
          if (updateVals.form_items[i].label === item.label) {
            Object.keys(updateVals.form_items[i]).forEach((key: string) => {
              expect(updateVals.form_items[i][key]).toStrictEqual(item[key]);
            });
          }
        }
      });

      done();
    });
  });
});
