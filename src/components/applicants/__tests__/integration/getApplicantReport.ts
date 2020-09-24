import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
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

let jobId: string;
beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenant_id);
  jobId = (await dataGenerator.insertJob(mockUser.tenant_id)).job_id;
});

afterAll(async () => {
  await truncateAllTables();
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET applicants/:applicant_id/report', () => {
    let applicant: TApplicant;
    beforeEach(async () => {
      const form: TForm = await dataGenerator.insertForm(
        mockUser.tenant_id,
        jobId,
        EFormCategory.application,
      );

      applicant = await dataGenerator.insertApplicant(
        mockUser.tenant_id,
        jobId,
        form.form_fields.map(({form_field_id}) => form_field_id),
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
});
