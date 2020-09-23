import request from 'supertest';
import app from 'app';
import db from 'db';
import {endConnection, truncateAllTables} from 'db/utils';
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
    deleteObjects: () => ({promise: () => Promise.resolve()}),
  })),
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
  describe('DELETE /applicants/:applicant_id', () => {
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
