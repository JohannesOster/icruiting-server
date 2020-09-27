import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';
import db from 'db';
import {Applicant} from 'db/repos/applicants';
import {Form} from 'db/repos/forms';

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
    let applicant: Applicant;
    let form: Form;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      const {jobId} = await dataGenerator.insertJob(tenantId);
      form = await dataGenerator.insertForm(tenantId, jobId, 'application');

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
