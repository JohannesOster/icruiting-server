import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import db from 'db';
import {endConnection, truncateAllTables} from 'db/utils';
import {TApplicant} from '../types';
import {dbInsertApplicant} from '../database';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertTenant} from 'components/tenants';
import {dbInsertJob} from 'components/jobs';
import fake from 'tests/fake';
import {randomElement} from 'utils';

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
    getSignedUrlPromise: () => Promise.resolve(''),
  })),
}));

let jobIds: string[];
beforeAll(async () => {
  const fakeTenant = fake.tenant(mockUser.tenant_id);
  await dbInsertTenant(fakeTenant);

  const jobsCount = random.number({min: 5, max: 20});
  const promises = Array(jobsCount)
    .fill(0)
    .map(() => {
      const fakeJob = fake.job(mockUser.tenant_id);
      return dbInsertJob(fakeJob);
    });

  const jobs = await Promise.all(promises);
  jobIds = jobs.map(({job_id}) => job_id);
});

afterAll(async () => {
  await truncateAllTables();
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET applicants/:applicant_id/report', () => {
    let applicant: TApplicant;
    beforeAll(async () => {
      const jobId = randomElement(jobIds);
      const fakeForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      applicant = await dbInsertApplicant(
        fake.applicant(mockUser.tenant_id, jobId, formFieldIds),
      );
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get(
          `/applicants/${applicant.applicant_id}/report?form_category=screening`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('requires form_category query', (done) => {
      request(app)
        .get(`/applicants/${applicant.applicant_id}/report`)
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });

  describe('DELETE /applicants/:applicant_id', () => {
    let applicant: TApplicant;
    beforeEach(async () => {
      const jobId = randomElement(jobIds);
      const fakeForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const fakeApplicant = fake.applicant(
        mockUser.tenant_id,
        jobId,
        formFieldIds,
      );
      applicant = await dbInsertApplicant(fakeApplicant);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/applicants/${applicant.applicant_id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes applicant', async () => {
      await request(app)
        .del(`/applicants/${applicant.applicant_id}`)
        .set('Accept', 'application/json');

      const stmt = 'SELECT COUNT(*) FROM applicant WHERE applicant_id = $1';
      const {count} = await db.one(stmt, applicant.applicant_id);

      expect(parseInt(count)).toBe(0);
    });
  });
});
