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

describe('screenings', () => {
  describe('POST /screenings', () => {
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
            applicant_id: applicant.applicant_id,
            submitter_id: process.env.TEST_USER_ID,
            form_id: form.form_id,
            values: {
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

    it('Returns 201 json response', (done) => {
      request(app)
        .post('/screenings')
        .set('Accept', 'application/json')
        .send(screening)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created screening entity', async (done) => {
      await request(app)
        .post('/screenings')
        .set('Accept', 'application/json')
        .send(screening)
        .expect(201);

      const stmt =
        'SELECT COUNT(*) FROM screening' +
        ' WHERE applicant_id=${applicant_id}' +
        ' AND submitter_id=${submitter_id}';

      const {count} = (await db.any(stmt, screening))[0];
      expect(parseInt(count)).toBe(1);

      done();
    });
  });
});
