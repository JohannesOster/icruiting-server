import {random} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Form, Job, JobRequirement} from 'domain/entities';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
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
  endConnection();
});

describe('jobs', () => {
  let job: Job;
  let forms: Form[];
  beforeAll(async () => {
    job = await dataGenerator.insertJob(mockUser.tenantId);
    forms = await Promise.all([
      dataGenerator.insertForm(mockUser.tenantId, job.jobId, 'application'),
      dataGenerator.insertForm(mockUser.tenantId, job.jobId, 'screening'),
      dataGenerator.insertForm(mockUser.tenantId, job.jobId, 'assessment'),
      dataGenerator.insertForm(mockUser.tenantId, job.jobId, 'onboarding'),
    ]);
  });

  describe('GET /jobs/:jobId/export', () => {
    it('Returns 200 json response', async (done) => {
      request(app)
        .get(`/jobs/${job.jobId}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Drops ids of job and jobRequirements', async () => {
      const {body} = await request(app)
        .get(`/jobs/${job.jobId}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.jobId).toBeUndefined();
      expect(body.tenantId).toBeUndefined();
      expect(body.jobRequirements.length).toBe(job.jobRequirements.length);
      body.jobRequirements.forEach((req: JobRequirement) =>
        expect(req.jobRequirementId).toBeUndefined(),
      );
    });

    it('Returns all forms', async () => {
      const {body} = await request(app)
        .get(`/jobs/${job.jobId}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.forms.length).toBe(forms.length);
    });

    it('Removes all ids from form and formField', async () => {
      const {body} = await request(app)
        .get(`/jobs/${job.jobId}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      body.forms.forEach((form: Form) => {
        expect(form.formId).toBeUndefined();
        expect(form.tenantId).toBeUndefined();
        expect(form.jobId).toBeUndefined();
        form.formFields.forEach((formField) => {
          expect(formField.formFieldId).toBeUndefined();
          expect(formField.jobRequirementId).toBeUndefined();
        });
      });
    });
  });
});
