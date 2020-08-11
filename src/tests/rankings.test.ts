import request from 'supertest';
import app from '../app';
import {endConnection, truncateAllTables} from '../db/utils';
import db from '../db';
import {insertForm} from '../db/forms.db';
import {insertScreening} from '../db/screenings.db';
import {insertApplicant} from '../db/applicants.db';
import fake from './fake';
import faker from 'faker';

jest.mock('../middlewares/auth');

let jobId: string;
beforeAll(async (done) => {
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

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('rankings', () => {
  describe('GET screening rankings', () => {
    let applicantsCount: number;
    beforeAll(async (done) => {
      await db.none('DELETE FROM form');

      const promises = [];
      const orgId = process.env.TEST_ORG_ID || '';

      promises.push(insertForm(fake.screeningForm(orgId, jobId) as any));

      applicantsCount = 4;
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          promises.push(insertApplicant(fake.applicant(orgId, jobId) as any));
        });

      Promise.all(promises)
        .then((data: any) => {
          const promises: any = [];

          const form = data[0];
          /*  insertApplicant returns array in form of [{applicant_id: ...}] */
          const applicants = data.slice(1).map((appl: any) => appl[0]);

          const range = {min: 0, max: 5};

          applicants.forEach((appl: any) => {
            const screening = {
              applicant_id: appl.applicant_id,
              submitter_id: faker.random.uuid(),
              form_id: form.form_id,
              submission: {
                [faker.random.alphaNumeric()]: faker.random.number(range),
                [faker.random.alphaNumeric()]: faker.random.number(range),
                [faker.random.alphaNumeric()]: faker.random.number(range),
                [faker.random.alphaNumeric()]: faker.random.number(range),
              },
            };

            promises.push(insertScreening(screening));
          });

          Promise.all(promises).finally(done);
        })
        .catch((err) => {
          console.error(err);
        });
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?form_category=screening`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?form_category=screening`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
      done();
    });

    it('Returns result ordered from highest score to lowest', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?form_category=screening`)
        .set('Accept', 'application/json')
        .expect(200);

      for (let i = 0; i < resp.body.length - 2; ++i) {
        expect(parseInt(resp.body[i].score)).toBeGreaterThanOrEqual(
          parseInt(resp.body[i + 1].score),
        );
      }

      done();
    });
  });
});

describe('rankings', () => {
  describe('GET assessment rankings', () => {
    let applicantsCount: number;
    beforeAll(async (done) => {
      await db.none('DELETE FROM form');

      const promises = [];
      const orgId = process.env.TEST_ORG_ID || '';

      promises.push(insertForm(fake.screeningForm(orgId, jobId) as any));

      applicantsCount = 4;
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          promises.push(insertApplicant(fake.applicant(orgId, jobId) as any));
        });

      Promise.all(promises)
        .then((data: any) => {
          const promises: any = [];

          const form = data[0];
          /*  insertApplicant returns array in form of [{applicant_id: ...}] */
          const applicants = data.slice(1).map((appl: any) => appl[0]);

          const range = {min: 0, max: 5};

          applicants.forEach((appl: any) => {
            const screening = {
              applicant_id: appl.applicant_id,
              submitter_id: faker.random.uuid(),
              form_id: form.form_id,
              submission: {
                [faker.random.alphaNumeric()]: faker.random.number(range),
                [faker.random.alphaNumeric()]: faker.random.number(range),
                [faker.random.alphaNumeric()]: faker.random.number(range),
                [faker.random.alphaNumeric()]: faker.random.number(range),
              },
            };

            promises.push(insertScreening(screening));
          });

          Promise.all(promises).finally(done);
        })
        .catch((err) => {
          console.error(err);
        });
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?form_category=screening`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?form_category=screening`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
      done();
    });

    it('Returns result ordered from highest score to lowest', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?form_category=screening`)
        .set('Accept', 'application/json')
        .expect(200);

      for (let i = 0; i < resp.body.length - 2; ++i) {
        expect(parseInt(resp.body[i].score)).toBeGreaterThanOrEqual(
          parseInt(resp.body[i + 1].score),
        );
      }

      done();
    });
  });
});
