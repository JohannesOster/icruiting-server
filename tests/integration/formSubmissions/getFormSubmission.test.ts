import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {FormSubmission} from 'modules/formSubmissions/domain';
import {formSubmissionsMapper} from 'modules/formSubmissions/mappers';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
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

describe('form-submissions', () => {
  describe('GET /form-submissions/:formId/:applicantId', () => {
    let formSubmission: FormSubmission;
    beforeAll(async () => {
      const {tenantId, userId} = mockUser;
      const screeningForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'screening',
      );
      const applForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      const formFieldIds = applForm.formFields.map(({id}) => id);

      const {applicantId} = (await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        formFieldIds,
      )) as any;

      formSubmission = await dataGenerator.insertFormSubmission(
        tenantId,
        applicantId,
        userId,
        screeningForm.id,
        screeningForm.formFields.map(({id}) => id),
      );
    });

    it('returns 200 json response', (done) => {
      request(app)
        .get(
          `/form-submissions/${formSubmission.formId}/${formSubmission.applicantId}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns inserted screening', async () => {
      const resp = await request(app)
        .get(
          `/form-submissions/${formSubmission.formId}/${formSubmission.applicantId}`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(resp.body).toStrictEqual(
        formSubmissionsMapper.toDTO(mockUser.tenantId, formSubmission),
      );
    });
  });
});
