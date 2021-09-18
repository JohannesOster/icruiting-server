import request from 'supertest';
import {random} from 'faker';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import db, {pgp} from 'infrastructure/db';
import {Form} from 'modules/forms/domain';
import {ApplicantsRepository} from 'modules/applicants/infrastructure/repositories/applicantsRepository';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
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

const applicantsRepo = ApplicantsRepository({db, pgp});

describe('applicants', () => {
  describe('PUT /applicants/:applicantId', () => {
    let applicant: any;
    let form: Form;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      const {id: jobId} = await dataGenerator.insertJob(tenantId);
      form = await dataGenerator.insertForm(tenantId, jobId, 'application');

      const _applicant = {
        jobId,
        tenantId: mockUser.tenantId,
        attributes: [
          {
            formFieldId: form.formFields[0].id,
            attributeValue: random.word(),
          },
        ],
      };

      applicant = await applicantsRepo.create(_applicant);
    });

    it('returns json 200 response', (done) => {
      request(app)
        .put(`/applicants/${applicant.applicantId}`)
        .set('Accept', 'application/json')
        .field('formId', form.id)
        .field(form.formFields[0].id, random.words())
        .field(form.formFields[1].id, random.words())
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });
});
