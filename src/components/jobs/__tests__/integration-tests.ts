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
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('jobs', () => {
  describe('DELETE /jobs/:jobId', () => {
    let job: any;
    beforeEach(async () => {
      job = await dataGenerator.insertJob(mockUser.tenantId);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes job entity', async () => {
      await request(app)
        .del(`/jobs/${job.jobId}`)
        .set('Accept', 'application/json')
        .expect(200);

      const stmt = 'SELECT COUNT(*) FROM job WHERE jobId = $1';
      const {count} = await db.one(stmt, job.jobId);

      expect(parseInt(count)).toBe(0);
    });
  });

  describe('POST /jobs/:jobId/applicant-reports', () => {
    let jobId: string;
    let report: any;
    beforeAll(async () => {
      const fakeJob = fake.job(mockUser.tenantId);
      jobId = (await dataGenerator.insertJob(mockUser.tenantId)).jobId;

      const fakeForm = fake.applicationForm(mockUser.tenantId, jobId);
      const form: TForm = await dbInsertForm(fakeForm);

      report = form.formFields.reduce(
        (acc, {component, formFieldId}) => {
          if (component === 'file_upload') acc.image = formFieldId;
          else acc.attributes.push(formFieldId);
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

      expect(resp.body.applicantReportId).toBeDefined();

      const {count} = await db.one(
        'SELECT COUNT(*) FROM applicant_report WHERE applicantReportId=$1',
        resp.body.applicantReportId,
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

  describe('PUT /jobs/:jobId/applicant-reports', () => {
    let jobId: string;
    let report: any;
    beforeAll(async () => {
      const fakeJob = fake.job(mockUser.tenantId);
      jobId = (await dataGenerator.insertJob(mockUser.tenantId)).jobId;

      const fakeForm = fake.applicationForm(mockUser.tenantId, jobId);
      const form: TForm = await dbInsertForm(fakeForm);

      const _report = form.formFields.reduce(
        (acc, {component, formFieldId}) => {
          if (component === 'file_upload') acc.image = formFieldId;
          else acc.attributes.push(formFieldId);
          return acc;
        },
        {attributes: [], image: ''} as any,
      );

      report = await dbInsertApplicantReport({
        jobId: jobId,
        tenantId: mockUser.tenantId,
        attributes: _report.attributes,
        image: _report.image,
      });
    });

    it('returns 200 json response', (done) => {
      const updateVals = {attributes: []};
      request(app)
        .put(`/jobs/${jobId}/applicant-reports/${report.applicantReportId}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('validates request parameters', (done) => {
      request(app)
        .put(`/jobs/${jobId}/applicant-reports/${report.applicantReportId}`)
        .set('Accept', 'application/json')
        .send({})
        .expect(422, done);
    });

    it('returns updated entity', async () => {
      const updateVals = {attributes: [report.attributes[0].formFieldId]};
      const resp = await request(app)
        .put(`/jobs/${jobId}/applicant-reports/${report.applicantReportId}`)
        .set('Accept', 'application/json')
        .send(updateVals)
        .expect(200);

      expect(resp.body.attributes[0].formFieldId).toStrictEqual(
        updateVals.attributes[0],
      );
    });
  });
});
