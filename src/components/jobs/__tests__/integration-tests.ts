import faker, {random} from 'faker';
import request from 'supertest';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import {dbInsertApplicantReport, dbInsertJob} from '../database';
import {TJob} from '../types';
import {dbInsertForm, TForm} from 'components/forms';
import dataGenerator from 'tests/dataGenerator';

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

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenant_id);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
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
      const {tenant_id} = await dataGenerator.insertTenant();

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

  describe('POST /jobs/:job_id/applicant-reports', () => {
    let jobId: string;
    let report: any;
    beforeAll(async () => {
      const fakeJob = fake.job(mockUser.tenant_id);
      jobId = (await dbInsertJob(fakeJob)).job_id;

      const fakeForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeForm);

      report = form.form_fields.reduce(
        (acc, {component, form_field_id}) => {
          if (component === 'file_upload') acc.image = form_field_id;
          else acc.attributes.push(form_field_id);
          return acc;
        },
        {attributes: [], image: ''} as any,
      );
    });

    afterEach(async () => await db.none('TRUNCATE applicant_report CASCADE'));

    it('returns 201 json response', (done) => {
      request(app)
        .post(`/jobs/${jobId}/applicant-reports`)
        .set('Accept', 'application/json')
        .send(report)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('validates request parameters', (done) => {
      request(app)
        .post(`/jobs/${jobId}/applicant-reports`)
        .set('Accept', 'application/json')
        .send({})
        .expect('Content-Type', /json/)
        .expect(422, done);
    });

    it('returns inserted entity', async () => {
      const resp = await request(app)
        .post(`/jobs/${jobId}/applicant-reports`)
        .set('Accept', 'application/json')
        .send(report)
        .expect(201);

      expect(resp.body.applicant_report_id).toBeDefined();

      const {count} = await db.one(
        'SELECT COUNT(*) FROM applicant_report WHERE applicant_report_id=$1',
        resp.body.applicant_report_id,
      );

      expect(parseInt(count)).toBe(1);

      expect(resp.body.image).toBe(report.image);
    });

    it('allowes empty attributes result', (done) => {
      request(app)
        .post(`/jobs/${jobId}/applicant-reports`)
        .set('Accept', 'application/json')
        .send({attributes: [], image: report.image})
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('allowes undefined image', (done) => {
      request(app)
        .post(`/jobs/${jobId}/applicant-reports`)
        .set('Accept', 'application/json')
        .send({attributes: []})
        .expect('Content-Type', /json/)
        .expect(201, done);
    });
  });

  describe('PUT /jobs/:job_id/applicant-reports', () => {
    let jobId: string;
    let report: any;
    beforeAll(async () => {
      const fakeJob = fake.job(mockUser.tenant_id);
      jobId = (await dbInsertJob(fakeJob)).job_id;

      const fakeForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeForm);

      const _report = form.form_fields.reduce(
        (acc, {component, form_field_id}) => {
          if (component === 'file_upload') acc.image = form_field_id;
          else acc.attributes.push(form_field_id);
          return acc;
        },
        {attributes: [], image: ''} as any,
      );

      report = await dbInsertApplicantReport({
        job_id: jobId,
        tenant_id: mockUser.tenant_id,
        attributes: _report.attributes,
        image: _report.image,
      });
    });

    it('returns 200 json response', (done) => {
      const updateVals = {attributes: []};
      request(app)
        .put(`/jobs/${jobId}/applicant-reports/${report.applicant_report_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('validates request parameters', (done) => {
      request(app)
        .put(`/jobs/${jobId}/applicant-reports/${report.applicant_report_id}`)
        .set('Accept', 'application/json')
        .send({})
        .expect(422, done);
    });

    it('returns updated entity', async () => {
      const updateVals = {attributes: [report.attributes[0].form_field_id]};
      const resp = await request(app)
        .put(`/jobs/${jobId}/applicant-reports/${report.applicant_report_id}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body.attributes[0].form_field_id).toStrictEqual(
        updateVals.attributes[0],
      );
    });
  });
});
