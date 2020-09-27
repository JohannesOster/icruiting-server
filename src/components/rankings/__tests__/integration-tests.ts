import request from 'supertest';
import faker from 'faker';
import app from 'app';
import db from 'db';
import fake from 'tests/fake';
import {endConnection, truncateAllTables} from 'db/setup';
import dataGenerator from 'tests/dataGenerator';
import {EFormCategory, Form} from 'db/repos/forms';
import {Applicant} from 'db/repos/applicants';

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
    beforeAll(async () => {
      await db.none('DELETE FROM form');

      const promises = [];

      promises.push(
        dataGenerator.insertForm(
          mockUser.tenantId,
          jobId,
          EFormCategory.screening,
        ),
      );

      const form = await dataGenerator.insertForm(
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

      await Promise.all(promises).then(async (data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [Form, ...Array<Applicant>];

        applicants.forEach((appl) => {
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

        await Promise.all(promises);
      });
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?formCategory=screening`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async () => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=screening`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
    });

    it('Returns result ordered from highest score to lowest', async () => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=screening`)
        .set('Accept', 'application/json')
        .expect(200);

      for (let i = 0; i < resp.body.length - 2; ++i) {
        expect(parseInt(resp.body[i].score)).toBeGreaterThanOrEqual(
          parseInt(resp.body[i + 1].score),
        );
      }
    });
  });

  describe('GET assessment rankings', () => {
    let applicantsCount: number;
    beforeAll(async () => {
      await db.none('DELETE FROM form');

      const promises: Promise<any>[] = [];

      promises.push(
        dataGenerator.insertForm(
          mockUser.tenantId,
          jobId,
          EFormCategory.assessment,
        ),
      );

      const form = await dataGenerator.insertForm(
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

      await Promise.all(promises).then(async (data) => {
        const promises: Array<Promise<any>> = [];
        const [form, ...applicants] = data as [Form, ...Array<Applicant>];

        applicants.forEach((appl) => {
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

        await Promise.all(promises);
      });
    });

    it('Returns 200 json response', (done) => {
      request(app)
        .get(`/rankings/${jobId}?formCategory=assessment`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns result including all applicants', async () => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=assessment`)
        .set('Accept', 'application/json')
        .expect(200);
      expect(resp.body.length).toBe(applicantsCount);
    });

    it('Returns result ordered from highest score to lowest', async () => {
      const resp = await request(app)
        .get(`/rankings/${jobId}?formCategory=assessment`)
        .set('Accept', 'application/json')
        .expect(200);

      for (let i = 0; i < resp.body.length - 2; ++i) {
        expect(parseInt(resp.body[i].score)).toBeGreaterThanOrEqual(
          parseInt(resp.body[i + 1].score),
        );
      }
    });
  });
});
