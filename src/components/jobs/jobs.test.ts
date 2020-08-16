import faker from 'faker';
import request from 'supertest';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/utils';
import {dbInsertJob} from './database';
import {dbInsertOrganization} from 'components/organizations';

jest.mock('middlewares/auth');

beforeAll(async (done) => {
  const fakeOrg = fake.organization(process.env.TEST_ORG_ID);
  dbInsertOrganization(fakeOrg);
  done();
});

beforeEach(async (done) => {
  await db.none('DELETE FROM job');
  done();
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('POST /jobs', () => {
    const organizationId = process.env.TEST_ORG_ID || '';
    it('Returns 202 json response', (done) => {
      const job = fake.job(organizationId);
      request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created job entity as json object', async (done) => {
      const job = fake.job(organizationId);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      expect(resp.body.job_title).toBe(job.job_title);

      // make shure all requirements are present in resp
      const respReqs = resp.body.job_requirements;
      let count = 0; // count equalities
      job.job_requirements.forEach((req) => {
        for (let i = 0; i < respReqs.length; ++i) {
          if (respReqs[i].requirement_label === req.requirement_label) ++count;
        }
      });

      expect(count).toBe(job.job_requirements.length);

      done();
    });

    it('Actually inserts job enitity', async (done) => {
      const job = fake.job(organizationId);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);
      const {job_id} = resp.body;

      const stmt = 'SELECT COUNT(*) FROM job WHERE job_id=$1';
      const {count} = await db.one(stmt, job_id);
      expect(parseInt(count)).toBe(1);

      done();
    });

    it('Actually inserts job_requirement enitities', async (done) => {
      const job = fake.job(organizationId);
      const resp = await request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect(201);

      const {job_id} = resp.body;

      const stmt = 'SELECT COUNT(*) FROM job_requirement WHERE job_id=$1';
      const {count} = await db.one(stmt, job_id);
      expect(parseInt(count)).toBe(job.job_requirements.length);

      done();
    });
  });

  describe('GET /jobs', () => {
    it('Returns 200 json response', async (done) => {
      request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns empty array if ther are no jobs', async (done) => {
      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.length).toBe(0);

      done();
    });

    it('Returns arra of jobs with its job_requirements', async (done) => {
      const job = fake.job(process.env.TEST_ORG_ID || '');
      await dbInsertJob(job);

      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.length).toBe(1);
      expect(resp.body[0].job_title).toBe(job.job_title);
      const requirementLabels = job.job_requirements.map(
        (req) => req.requirement_label,
      );
      resp.body[0].job_requirements.forEach((req: any) => {
        expect(requirementLabels.includes(req.requirement_label)).toBe(true);
      });

      done();
    });
  });

  describe('PUT /jobs/:job_id', () => {
    let job: any;
    beforeEach(async (done) => {
      const fakeJob = fake.job(process.env.TEST_ORG_ID || '');
      job = await dbInsertJob(fakeJob);
      done();
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send({})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated entity', async (done) => {
      const updateValues = job;
      updateValues.job_title = faker.random.alphaNumeric();
      updateValues.job_requirements = updateValues.job_requirements.map(
        (req: any) => {
          return {...req, requirement_label: faker.random.alphaNumeric()};
        },
      );

      const resp = await request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.job_title).toBe(updateValues.job_title);
      expect(resp.body.job_requirements).toEqual(updateValues.job_requirements);

      done();
    });
  });
});
