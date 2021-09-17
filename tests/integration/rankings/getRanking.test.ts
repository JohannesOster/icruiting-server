import request from 'supertest';
import faker from 'faker';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Applicant} from 'domain/entities';
import {Form} from 'modules/forms/domain';
import {createFormSubmission} from 'modules/formSubmissions/domain';
import {formSubmissionsMapper} from 'modules/formSubmissions/mappers';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).id;
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
        dataGenerator.insertForm(mockUser.tenantId, jobId, 'screening'),
      );

      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
      const formFieldIds = form.formFields.map(({id}) => id);

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(
            mockUser.tenantId,
            jobId,
            formFieldIds,
          );
          promises.push(db.applicants.create(applicant));
        });

      await Promise.all(promises).then(async (data) => {
        const promises: Promise<any>[] = [];
        const [form, ...applicants] = data as [Form, ...Applicant[]];

        applicants.forEach((appl) => {
          const screening = createFormSubmission({
            applicantId: appl.applicantId!,
            submitterId: mockUser.userId,
            formId: form.id,
            submission: form.formFields.reduce(
              (acc: {[formFieldId: string]: string}, item) => {
                acc[item.id] = faker.random.number({min: 0, max: 5}).toString();
                return acc;
              },
              {},
            ),
          });

          promises.push(
            db.formSubmissions.create(
              formSubmissionsMapper.toPersistance(mockUser.tenantId, screening),
            ),
          );
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
        expect(parseInt(resp.body[i].score, 10)).toBeGreaterThanOrEqual(
          parseInt(resp.body[i + 1].score, 10),
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
        dataGenerator.insertForm(mockUser.tenantId, jobId, 'assessment'),
      );

      const form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );

      const formFieldIds = form.formFields.map(({id}) => id);

      applicantsCount = faker.random.number({min: 5, max: 20});
      Array(applicantsCount)
        .fill(0)
        .forEach(() => {
          const applicant = fake.applicant(
            mockUser.tenantId,
            jobId,
            formFieldIds,
          );
          promises.push(db.applicants.create(applicant));
        });

      await Promise.all(promises).then(async (data) => {
        const promises: Promise<any>[] = [];
        const [form, ...applicants] = data as [Form, ...Applicant[]];

        applicants.forEach((appl) => {
          const assessment = createFormSubmission({
            applicantId: appl.applicantId!,
            submitterId: mockUser.userId,
            formId: form.id,
            submission: form.formFields.reduce(
              (acc: {[formFieldId: string]: string}, item) => {
                acc[item.id] = faker.random.number({min: 0, max: 5}).toString();
                return acc;
              },
              {},
            ),
          });

          promises.push(
            db.formSubmissions.create(
              formSubmissionsMapper.toPersistance(
                mockUser.tenantId,
                assessment,
              ),
            ),
          );
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
        expect(parseInt(resp.body[i].score, 10)).toBeGreaterThanOrEqual(
          parseInt(resp.body[i + 1].score, 10),
        );
      }
    });
  });
});
