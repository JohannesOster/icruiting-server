import request from 'supertest';
import faker from 'faker';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import {EFormCategory, TForm} from 'components/forms';
import {TApplicant} from 'components/applicants';
import dataGenerator from 'tests/dataGenerator';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).jobId;
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

      promises.push(
        dataGenerator.insertForm(
          mockUser.tenantId,
          jobId,
          EFormCategory.screening,
        ),
      );

      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );
      const formFieldIds = form.formFields.map(({formFieldId}) => formFieldId!);

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(
            mockUser.tenantId,
            jobId,
            formFieldIds,
          );
          promises.push(db.applicants.insert(applicant));
        });

      Promise.all(promises).then((data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [TForm, ...Array<TApplicant>];

        applicants.forEach((appl: TApplicant) => {
          const screening = {
            applicantId: appl.applicantId!,
            submitterId: mockUser.userId,
            tenantId: mockUser.tenantId,
            formId: form.formId!,
            submission: form.formFields.reduce(
              (acc: {[formFieldId: string]: string}, item) => {
                acc[item.formFieldId!] = faker.random
                  .number({min: 0, max: 5})
                  .toString();
                return acc;
              },
              {},
            ),
          };

          promises.push(db.formSubmissions.insert(screening));
        });

        Promise.all(promises).finally(done);
      });
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?formCategory=screening`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=screening`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
      done();
    });

    it('Returns result ordered from highest score to lowest', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=screening`)
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

      const promises: Promise<any>[] = [];

      const assessmentForm: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.assessment,
      );
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        EFormCategory.application,
      );

      const formFieldIds = form.formFields.map(({formFieldId}) => formFieldId!);

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(
            mockUser.tenantId,
            jobId,
            formFieldIds,
          );
          promises.push(db.applicants.insert(applicant));
        });

      Promise.all(promises).then((data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [TForm, ...Array<TApplicant>];

        applicants.forEach((appl: TApplicant) => {
          const assessment = {
            applicantId: appl.applicantId!,
            submitterId: mockUser.userId,
            tenantId: mockUser.tenantId,
            formId: form.formId!,
            submission: form.formFields.reduce(
              (acc: {[formFieldId: string]: string}, item) => {
                acc[item.formFieldId!] = faker.random
                  .number({min: 0, max: 5})
                  .toString();
                return acc;
              },
              {},
            ),
          };

          promises.push(db.formSubmissions.insert(assessment));
        });

        Promise.all(promises).finally(done);
      });
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?formCategory=assessment`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=assessment`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
      done();
    });

    it('Returns result ordered from highest score to lowest', async (done) => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=assessment`)
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
