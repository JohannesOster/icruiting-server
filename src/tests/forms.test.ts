import request from 'supertest';
import app from '../app';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import db from '../db';
import {insertForm} from '../db/forms.db';
import {insertApplicant} from '../db/applicants.db';
import fake from './fake';
import faker from 'faker';

jest.mock('../middlewares/auth');

let jobId: string;
beforeAll(async (done) => {
  await createAllTables();

  const insert = db.$config.pgp.helpers.insert;

  const organization = fake.organization(process.env.TEST_ORG_ID);
  const insOrg = insert(organization, null, 'organization');
  await db.none(insOrg);

  const job = fake.job(organization.organization_id);
  const insJob = insert(job, null, 'job');
  await db.none(insJob);

  const job_requirement = fake.job_requirement(job.job_id);
  const insReq = insert(job_requirement, null, 'job_requirement');
  await db.none(insReq);

  jobId = job.job_id; // set jobId for "global" access in test file

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

  describe('POST /forms/:form_id', () => {
    let screening: any;
    beforeAll(async (done) => {
      await db.none('DELETE FROM form');

      const promises = [];

      const orgId = process.env.TEST_ORG_ID || '';

      const fakeForm: any = fake.screeningForm(orgId, jobId);
      promises.push(insertForm(fakeForm));

      const fakeApplicant: any = fake.applicant(orgId, jobId);
      promises.push(insertApplicant(fakeApplicant));

      screening = await Promise.all(promises)
        .then((data: any) => {
          const form = data[0];
          const applicant = data[1][0];

          const range = {min: 0, max: 5};

          return {
            applicantId: applicant.applicant_id,
            submitterId: process.env.TEST_USER_ID,
            formId: form.form_id,
            submission: {
              [faker.random.alphaNumeric()]: faker.random.number(range),
              [faker.random.alphaNumeric()]: faker.random.number(range),
              [faker.random.alphaNumeric()]: faker.random.number(range),
              [faker.random.alphaNumeric()]: faker.random.number(range),
            },
          };
        })
        .catch((err) => {
          console.error(err);
        });

      done();
    });

    afterEach((done) => {
      db.none('DELETE FROM screening').finally(done);
    });

    it('Returns 200 json response for screening form', (done) => {
      request(app)
        .post(`/forms/${screening.formId}`)
        .set('Accept', 'application/json')
        .send(screening)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created screening entity', async (done) => {
      await request(app)
        .post(`/forms/${screening.formId}`)
        .set('Accept', 'application/json')
        .send(screening)
        .expect(201);

      const stmt =
        'SELECT COUNT(*) FROM screening' +
        ' WHERE applicant_id=${applicantId}' +
        ' AND submitter_id=${submitterId}';

      const {count} = (await db.any(stmt, screening))[0];
      expect(parseInt(count)).toBe(1);

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
});
