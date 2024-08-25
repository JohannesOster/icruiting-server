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
  describe('PUT /form-submissions/:formId/:applicantId', () => {
    let formSubmission: FormSubmission;
    beforeAll(async () => {
      const {tenantId, userId} = mockUser;
      const screeningForm = await dataGenerator.insertForm(tenantId, jobId, 'screening');
      const applForm = await dataGenerator.insertForm(tenantId, jobId, 'application');
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

    it('returns 201 json response', async () => {
      await request(app)
        .put(`/form-submissions/${formSubmission.id}`)
        .set('Accept', 'application/json')
        .send(formSubmissionsMapper.toDTO(mockUser.tenantId, formSubmission))
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('returns updated entity', async () => {
      const resp = await request(app)
        .put(`/form-submissions/${formSubmission.id}`)
        .set('Accept', 'application/json')
        .send(formSubmissionsMapper.toDTO(mockUser.tenantId, formSubmission))
        .expect(200);

      // make shure non passed properties stay unchanged
      expect(resp.body.formId).toBe(formSubmission.formId);
      expect(resp.body.applicantId).toBe(formSubmission.applicantId);
      expect(resp.body.submitterId).toBe(formSubmission.submitterId);
      expect(resp.body.submission).toStrictEqual(formSubmission.submission);
    });
  });
});
