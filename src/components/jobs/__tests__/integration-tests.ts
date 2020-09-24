import request from 'supertest';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import {dbInsertApplicantReport} from '../database';
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

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenant_id);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('DELETE /jobs/:job_id', () => {
    let job: any;
    beforeEach(async () => {
      job = await dataGenerator.insertJob(mockUser.tenant_id);
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
      jobId = (await dataGenerator.insertJob(mockUser.tenant_id)).job_id;

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
      jobId = (await dataGenerator.insertJob(mockUser.tenant_id)).job_id;

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
