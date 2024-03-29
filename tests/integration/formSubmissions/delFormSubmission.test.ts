import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import db, {pgp} from 'infrastructure/db';
import {FormSubmission} from 'modules/formSubmissions/domain';
import {Form} from 'modules/forms/domain';
import {FormSubmissionsRepository} from 'modules/formSubmissions/infrastructure/repositories/formSubmissions';

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

const formSubmissionsRepo = FormSubmissionsRepository({db, pgp});

describe('form-submissions', () => {
  describe('DELETE /form-submissions/:formSubmissionId', () => {
    let formSubmission: FormSubmission;
    let screeningForm: Form;
    let applicantId: string;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      screeningForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'screening',
      );
      const applForm = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );
      const formFieldIds = applForm.formFields.map(({id}) => id!);

      const applicant = (await dataGenerator.insertApplicant(
        tenantId,
        jobId,
        formFieldIds,
      )) as any; // as long as mapper not implemented

      applicantId = applicant.applicantId;
    });

    beforeEach(async () => {
      const {tenantId, userId} = mockUser;
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
        .del(`/form-submissions/${formSubmission.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes formSubmission', async () => {
      await request(app)
        .del(`/form-submissions/${formSubmission.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const {tenantId, userId: submitterId} = mockUser;
      const submission = await formSubmissionsRepo.retrieve({
        tenantId,
        submitterId,
        formId: formSubmission.formId,
        applicantId: formSubmission.applicantId,
      });

      expect(submission).toBeNull();
    });
  });
});
