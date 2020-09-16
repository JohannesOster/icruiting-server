import faker, {random} from 'faker';
import request from 'supertest';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/utils';
import {dbInsertJob} from './database';
import {TJob} from './types';
import {dbInsertTenant} from 'components/tenants';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    deleteObjects: () => ({
      promise: () => Promise.resolve(),
    }),
  })),
}));

beforeAll(async (done) => {
  const fakeTenant = fake.tenant(mockUser.tenant_id);
  await dbInsertTenant(fakeTenant);
  done();
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('POST /jobs', () => {
    it('Returns 202 json response', (done) => {
      const job = fake.job(mockUser.tenant_id);
      request(app)
        .post('/jobs')
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created job entity as json object', async (done) => {
      const job = fake.job(mockUser.tenant_id);
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
      const job = fake.job(mockUser.tenant_id);
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
      const job = fake.job(mockUser.tenant_id);
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
    afterEach(async () => await db.none('TRUNCATE job CASCADE'));

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

    it('Orders jobs by created_at', async (done) => {
      const jobsCount = faker.random.number({min: 5, max: 20});
      const fakeJobs = Array(jobsCount)
        .fill(0)
        .map(() => fake.job(mockUser.tenant_id));

      const promises = fakeJobs.map((job) => dbInsertJob(job));
      await Promise.all(promises);

      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body.length).toBe(jobsCount);
      for (let i = 0; i < jobsCount - 1; ++i) {
        const curr = new Date(resp.body[i].created_at);
        const following = new Date(resp.body[i + 1].created_at);
        expect(curr.valueOf()).toBeGreaterThanOrEqual(following.valueOf());
      }

      done();
    });

    it('Isolates tenant jobs', async (done) => {
      const {tenant_id} = await dbInsertTenant({
        tenant_name: fake.tenant().tenant_name,
      });

      // jobs for own tenant
      const jobsCount = faker.random.number({min: 1, max: 10});
      const fakeJobs = Array(jobsCount)
        .fill(0)
        .map(() => fake.job(mockUser.tenant_id));
      const promises = fakeJobs.map((job) => dbInsertJob(job));

      // jobs of foreign tenants
      const fakeJobsForeign = Array(jobsCount)
        .fill(0)
        .map(() => fake.job(tenant_id));
      promises.concat(fakeJobsForeign.map((job) => dbInsertJob(job)));

      await Promise.all(promises);

      const resp = await request(app)
        .get('/jobs')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((job: TJob) =>
        expect(job.tenant_id).toBe(mockUser.tenant_id),
      );

      done();
    });

    it('Returns arra of jobs with its job_requirements', async (done) => {
      const job = fake.job(mockUser.tenant_id);
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
      const fakeJob = fake.job(mockUser.tenant_id);
      job = await dbInsertJob(fakeJob);
      done();
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(job)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated entity', async (done) => {
      const updateValues = job;
      updateValues.job_title = random.alphaNumeric();
      updateValues.job_requirements = updateValues.job_requirements.map(
        (req: any) => {
          return {
            ...req,
            requirement_label: random.alphaNumeric(),
          };
        },
      );

      updateValues.job_requirements.shift(); // test if req gets removed

      const resp = await request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.job_title).toBe(updateValues.job_title);
      expect(resp.body.job_requirements).toEqual(updateValues.job_requirements);

      done();
    });

    it('Adds new requirement', async () => {
      const updateValues = job;
      updateValues.job_title = random.alphaNumeric();
      updateValues.job_requirements = updateValues.job_requirements.map(
        (req: any) => {
          return {
            ...req,
            requirement_label: random.alphaNumeric(),
            minimal_score: random.number(),
          };
        },
      );

      updateValues.job_requirements.push({
        requirement_label: random.alphaNumeric(),
        minimal_scorce: random.number(),
      });

      const resp = await request(app)
        .put(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .send(updateValues)
        .expect(200);

      expect(resp.body.job_requirements.length).toEqual(
        updateValues.job_requirements.length,
      );
    });
  });

  describe('DELETE /jobs/:job_id', () => {
    let job: any;
    beforeEach(async () => {
      job = await dbInsertJob(fake.job(mockUser.tenant_id));
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes job entity', async () => {
      await request(app)
        .del(`/jobs/${job.job_id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const stmt = 'SELECT COUNT(*) FROM job WHERE job_id = $1';
      const {count} = await db.one(stmt, job.job_id);

      expect(parseInt(count)).toBe(0);
    });
  });
});
