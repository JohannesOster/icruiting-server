import request from 'supertest';
import faker from 'faker';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/utils';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertFormSubmission} from 'components/formSubmissions';
import {dbInsertApplicant} from 'components/applicants';
import {dbInsertOrganization} from 'components/organizations';
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
  const organization = fake.organization(mockUser.orgID);
  const {organization_id} = await dbInsertOrganization(organization);

  const job = fake.job(organization_id);
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

      const screeningForm = fake.screeningForm(mockUser.orgID, jobId);
      promises.push(dbInsertForm(screeningForm));

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(mockUser.orgID, jobId);
          promises.push(dbInsertApplicant(applicant));
        });

      Promise.all(promises).then((data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [TForm, ...Array<TApplicant>];

        applicants.forEach((appl: TApplicant) => {
          const screening = {
            applicant_id: appl.applicant_id!,
            submitter_id: mockUser.sub,
            organization_id: mockUser.orgID,
            form_id: form.form_id!,
            submission: form.form_items.reduce(
              (acc: {[form_item_id: string]: string}, item) => {
                acc[item.form_item_id!] = faker.random
                  .number({min: 0, max: 5})
                  .toString();
                return acc;
              },
              {},
            ),
            comment: faker.random.words(),
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

      const screeningForm = fake.screeningForm(mockUser.orgID, jobId);
      promises.push(dbInsertForm(screeningForm));

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(mockUser.orgID, jobId);
          promises.push(dbInsertApplicant(applicant));
        });

      Promise.all(promises).then((data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [TForm, ...Array<TApplicant>];

        applicants.forEach((appl: TApplicant) => {
          const screening = {
            applicant_id: appl.applicant_id!,
            submitter_id: mockUser.sub,
            organization_id: mockUser.orgID,
            form_id: form.form_id!,
            submission: form.form_items.reduce(
              (acc: {[form_item_id: string]: string}, item) => {
                acc[item.form_item_id!] = faker.random
                  .number({min: 0, max: 5})
                  .toString();
                return acc;
              },
              {},
            ),
            comment: faker.random.words(),
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
});
