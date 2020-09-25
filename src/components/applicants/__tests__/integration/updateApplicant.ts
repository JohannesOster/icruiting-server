import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import {TApplicant} from '../../types';
import {TForm, EFormCategory} from 'components/forms';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';
import db from 'db';

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
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('PUT /applicants/:applicantId', () => {
    let applicant: TApplicant;
    let form: TForm;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      const {jobId} = await dataGenerator.insertJob(tenantId);
      form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        EFormCategory.application,
      );

      const _applicant = {
        tenantId: mockUser.tenantId,
        jobId: jobId,
        attributes: [
          {formFieldId: form.formFields[0].formFieldId, attributeValue: '1'},
        ],
      };

      applicant = await db.applicants.insert(_applicant);
    });

    it('returns json 200 response', (done) => {
      request(app)
        .put(`/applicants/${applicant.applicantId}`)
        .set('Accept', 'application/json')
        .field('formId', form.formId)
        .field(form.formFields[0].formFieldId, random.words())
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });
});
