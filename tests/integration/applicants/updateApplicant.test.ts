import request from 'supertest';
import {random} from 'faker';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import db from 'infrastructure/db';
import {Applicant} from 'infrastructure/db/repos/applicants';
import {Form} from 'infrastructure/db/repos/forms';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
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
        jobId,
        tenantId: mockUser.tenantId,
        attributes: [
          {
            formFieldId: form.formFields[0].formFieldId,
            attributeValue: random.word(),
          },
        ],
      };

      applicant = await db.applicants.create(_applicant);
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
