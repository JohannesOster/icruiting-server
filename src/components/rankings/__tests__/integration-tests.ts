import request from 'supertest';
import faker from 'faker';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/utils';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertFormSubmission} from 'components/formSubmissions';
import {dbInsertApplicant} from 'components/applicants';
import {dbInsertTenant} from 'components/tenants';
import {dbInsertJob} from 'components/jobs';
import {TApplicant} from 'components/applicants';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async (done) => {
  const tenant = fake.tenant(mockUser.tenant_id);
  const {tenant_id} = await dbInsertTenant(tenant);

  const job = fake.job(tenant_id);
  const {job_id} = await dbInsertJob(job);
  jobId = job_id;

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

      const screeningForm = fake.screeningForm(mockUser.tenant_id, jobId);
      promises.push(dbInsertForm(screeningForm));

      const fakeApplForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeApplForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(
            mockUser.tenant_id,
            jobId,
            formFieldIds,
          );
          promises.push(dbInsertApplicant(applicant));
        });

      Promise.all(promises).then((data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [TForm, ...Array<TApplicant>];

        applicants.forEach((appl: TApplicant) => {
          const screening = {
            applicant_id: appl.applicant_id!,
            submitter_id: mockUser.user_id,
            tenant_id: mockUser.tenant_id,
            form_id: form.form_id!,
            submission: form.form_fields.reduce(
              (acc: {[form_field_id: string]: string}, item) => {
                acc[item.form_field_id!] = faker.random
                  .number({min: 0, max: 5})
                  .toString();
                return acc;
              },
              {},
            ),
          };

          promises.push(dbInsertFormSubmission(screening));
        });

        Promise.all(promises).finally(done);
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

  describe('GET assessment rankings', () => {
    let applicantsCount: number;
    beforeAll(async (done) => {
      await db.none('DELETE FROM form');

      const promises = [];

      const assessmentForm = fake.assessmentForm(mockUser.tenant_id, jobId);
      promises.push(dbInsertForm(assessmentForm));
      const fakeApplForm = fake.applicationForm(mockUser.tenant_id, jobId);
      const form: TForm = await dbInsertForm(fakeApplForm);
      const formFieldIds = form.form_fields.map(
        ({form_field_id}) => form_field_id!,
      );

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(
            mockUser.tenant_id,
            jobId,
            formFieldIds,
          );
          promises.push(dbInsertApplicant(applicant));
        });

      Promise.all(promises).then((data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [TForm, ...Array<TApplicant>];

        applicants.forEach((appl: TApplicant) => {
          const assessment = {
            applicant_id: appl.applicant_id!,
            submitter_id: mockUser.user_id,
            tenant_id: mockUser.tenant_id,
            form_id: form.form_id!,
            submission: form.form_fields.reduce(
              (acc: {[form_field_id: string]: string}, item) => {
                acc[item.form_field_id!] = faker.random
                  .number({min: 0, max: 5})
                  .toString();
                return acc;
              },
              {},
            ),
          };

          promises.push(dbInsertFormSubmission(assessment));
        });

        Promise.all(promises).finally(done);
      });
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?form_category=assessment`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?form_category=assessment`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
      done();
    });

    it('Returns result ordered from highest score to lowest', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?form_category=assessment`)
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
