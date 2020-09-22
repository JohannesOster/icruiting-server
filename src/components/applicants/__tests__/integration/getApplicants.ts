import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/utils';
import {TApplicant} from '../../types';
import {dbInsertApplicant} from '../../database';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertFormSubmission} from 'components/formSubmissions';
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
  describe('GET /applicants', () => {
    let applicants: TApplicant[];
    beforeAll(async () => {
      const applicantsCount = random.number({min: 50, max: 100});
      const promises: Promise<TApplicant>[] = Array(applicantsCount)
        .fill(0)
        .map(async () => {
          const randJob = randomElement(jobIds);
          const fakeForm = fake.applicationForm(mockUser.tenant_id, randJob);
          const form: TForm = await dbInsertForm(fakeForm);
          const formFieldIds = form.form_fields.map(
            ({form_field_id}) => form_field_id!,
          );
          const fakeAppl = fake.applicant(
            mockUser.tenant_id,
            randJob,
            formFieldIds,
          );
          return dbInsertApplicant(fakeAppl);
        });

      applicants = await Promise.all(promises);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns unfiltered array of applicants', async (done) => {
      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body[0].applicant_id).toBeDefined();
      expect(res.body.length).toBe(applicants.length);
      done();
    });

    it('isloates applicants of tenant', async () => {
      const fakeTenant = fake.tenant(random.uuid());
      const {tenant_id} = await dbInsertTenant(fakeTenant);

      const fakeJob = fake.job(tenant_id);
      const {job_id} = await dbInsertJob(fakeJob);

      const fakeForm = fake.applicationForm(tenant_id, job_id);
      const form: TForm = await dbInsertForm(fakeForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const applicantsCount = random.number({min: 50, max: 100});
      const fakeApplicants = Array(applicantsCount)
        .fill(0)
        .map(() => fake.applicant(tenant_id, job_id, formFieldIds));
      const promises = fakeApplicants.map((appl) => dbInsertApplicant(appl));
      await Promise.all(promises);

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(applicants.length);

      const foreignApplicant = res.body.find(
        ({tenant_id}: TApplicant) => tenant_id !== mockUser.tenant_id,
      );

      expect(foreignApplicant).toBeUndefined();
    });

    it('filters by job_id using query', async (done) => {
      const fakeTenant = fake.tenant(random.uuid());
      const {tenant_id} = await dbInsertTenant(fakeTenant);

      const fakeJob = fake.job(tenant_id);
      const {job_id} = await dbInsertJob(fakeJob);

      const fakeForm = fake.applicationForm(tenant_id, job_id);
      const form: TForm = await dbInsertForm(fakeForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const applicantsCount = random.number({min: 50, max: 100});
      const fakeApplicants = Array(applicantsCount)
        .fill(0)
        .map(() => fake.applicant(tenant_id, job_id, formFieldIds));
      const promises = fakeApplicants.map((appl) => dbInsertApplicant(appl));
      await Promise.all(promises);

      const res = await request(app)
        .get('/applicants?job_id=' + job_id)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.length).toBe(0);

      done();
    });

    it('isloates tenant applicants with job_id query', async (done) => {
      const fakeTenant = fake.tenant(random.uuid());
      const {tenant_id} = await dbInsertTenant(fakeTenant);

      const fakeJob = fake.job(tenant_id);
      const {job_id} = await dbInsertJob(fakeJob);

      const fakeForm = fake.applicationForm(tenant_id, job_id);
      const form: TForm = await dbInsertForm(fakeForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      const applicantsCount = random.number({min: 50, max: 100});
      const fakeApplicants = Array(applicantsCount)
        .fill(0)
        .map(() => fake.applicant(tenant_id, job_id, formFieldIds));
      const promises = fakeApplicants.map((appl) => dbInsertApplicant(appl));
      await Promise.all(promises);

      const res = await request(app)
        .get('/applicants?job_id=' + job_id)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.length).toBe(0);

      done();
    });

    it('includes boolean weather screening exists or not', async (done) => {
      const fakeForm = fake.screeningForm(
        mockUser.tenant_id,
        randomElement(jobIds),
      );
      const form: TForm = await dbInsertForm(fakeForm);

      // insert screening for single applicant
      const randomApplIdx = random.number({min: 0, max: applicants.length - 1});
      const randomApplId = applicants[randomApplIdx].applicant_id;

      const screening = {
        form_id: form.form_id!,
        applicant_id: randomApplId!,
        submitter_id: mockUser.user_id,
        tenant_id: mockUser.tenant_id,
        comment: random.words(),
        submission: form.form_fields.reduce(
          (acc: {[form_field_id: string]: string}, item) => {
            acc[item.form_field_id!] = random
              .number({min: 0, max: 5})
              .toString();
            return acc;
          },
          {},
        ),
      };

      await dbInsertFormSubmission(screening);

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      const filtered = res.body.filter((appl: any) => appl.screening_exists);
      expect(filtered.length).toBe(1);
      expect(filtered[0].applicant_id).toBe(randomApplId);

      done();
    });
  });
});
