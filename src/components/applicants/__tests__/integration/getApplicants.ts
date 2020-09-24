import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'database/utils';
import {TApplicant} from '../../types';
import {TForm, EFormCategory} from 'components/forms';
import fake from 'tests/fake';
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
    getSignedUrlPromise: () => Promise.resolve(''),
  })),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenant_id);
});

afterAll(async () => {
  await truncateAllTables();
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET /applicants', () => {
    let applicants: TApplicant[];
    beforeAll(async () => {
      const {tenant_id} = mockUser;
      const {job_id} = await dataGenerator.insertJob(tenant_id);
      const form: TForm = await dataGenerator.insertForm(
        tenant_id,
        job_id,
        EFormCategory.application,
      );
      const applicant = await dataGenerator.insertApplicant(
        tenant_id,
        job_id,
        form.form_fields.map(({form_field_id}) => form_field_id),
      );
      applicants = [applicant];
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns array of applicants', async () => {
      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(applicants.length);
      expect(res.body[0].applicant_id).toBe(applicants[0].applicant_id);
    });

    it('isloates applicants of tenant', async () => {
      const {tenant_id} = await dataGenerator.insertTenant(random.uuid());
      const {job_id} = await dataGenerator.insertJob(tenant_id);
      const form: TForm = await dataGenerator.insertForm(
        tenant_id,
        job_id,
        EFormCategory.application,
      );
      const fieldIds = form.form_fields.map(({form_field_id}) => form_field_id);
      await dataGenerator.insertApplicant(tenant_id, job_id, fieldIds);

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(applicants.length);
      expect(res.body[0].applicant_id).toBe(applicants[0].applicant_id);
    });

    it('filters by job_id using query', async () => {
      const {job_id} = await dataGenerator.insertJob(mockUser.tenant_id);
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenant_id,
        job_id,
        EFormCategory.application,
      );

      const fieldIds = form.form_fields.map(({form_field_id}) => form_field_id);
      const applicant = await dataGenerator.insertApplicant(
        mockUser.tenant_id,
        job_id,
        fieldIds,
      );

      const res = await request(app)
        .get('/applicants?job_id=' + job_id)
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0].applicant_id).toBe(applicant.applicant_id);
    });

    it('isloates tenant applicants even if foreign job_id is queried', async () => {
      const {tenant_id} = await dataGenerator.insertTenant(random.uuid());
      const {job_id} = await dataGenerator.insertJob(tenant_id);
      const form: TForm = await dataGenerator.insertForm(
        tenant_id,
        job_id,
        EFormCategory.application,
      );
      const fieldIds = form.form_fields.map(({form_field_id}) => form_field_id);
      await dataGenerator.insertApplicant(tenant_id, job_id, fieldIds);

      const res = await request(app)
        .get('/applicants?job_id=' + job_id)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.length).toBe(0);
    });

    it('includes boolean weather screening exists or not', async () => {
      const {job_id, applicant_id} = applicants[0];
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenant_id,
        job_id,
        EFormCategory.screening,
      );

      await dataGenerator.insertFormSubmission(
        mockUser.tenant_id,
        applicant_id!,
        mockUser.user_id,
        form.form_id,
        form.form_fields.map(({form_field_id}) => form_field_id),
      );

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      const filtered = res.body.filter((appl: any) => appl.screening_exists);
      expect(filtered.length).toBe(1);
      expect(filtered[0].applicant_id).toBe(applicant_id);
    });
  });
});
