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
    let applicant: any; // as long as mapper not implemented
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

    beforeEach(async () => {
      await db.none('UPDATE applicant SET applicant_status=NULL');
    });

    it('returns json 200 response', (done) => {
      request(app)
        .put(`/applicants/${applicant.applicantId}/confirm`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns json 200 response', async () => {
      await request(app)
        .put(`/applicants/${applicant.applicantId}/confirm`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const {applicantStatus} = await db.one(
        'SELECT applicant_status FROM applicant WHERE applicant_id=$1',
        applicant.applicantId,
      );

      expect(applicantStatus).toBe('confirmed');
    });
  });
});
