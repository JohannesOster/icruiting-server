import request from 'supertest';
import app from 'infrastructure/http';
import fake from '../../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../../testUtils/dataGenerator';
import {Form} from 'domain/entities';
import {Job} from 'modules/jobs/domain';

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
      dataGenerator.insertForm(mockUser.tenantId, job.id, 'application'),
      dataGenerator.insertForm(mockUser.tenantId, job.id, 'screening'),
      dataGenerator.insertForm(mockUser.tenantId, job.id, 'assessment'),
      dataGenerator.insertForm(mockUser.tenantId, job.id, 'onboarding'),
    ]);
  });

  describe('GET /jobs/:jobId/export', () => {
    it('Returns 200 json response', async (done) => {
      request(app)
        .get(`/jobs/${job.id}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Drops tenantId of job', async () => {
      const {body} = await request(app)
        .get(`/jobs/${job.id}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.tenantId).toBeUndefined();
      expect(body.jobRequirements.length).toBe(job.jobRequirements.length);
    });

    it('Returns all forms', async () => {
      const {body} = await request(app)
        .get(`/jobs/${job.id}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.forms.length).toBe(forms.length);
    });

    it('Removes tenantId, formFieldId, jobId', async () => {
      const {body} = await request(app)
        .get(`/jobs/${job.id}/export`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      body.forms.forEach((form: any) => {
        expect(form.id).toBeUndefined();
        expect(form.tenantId).toBeUndefined();
        form.formFields.forEach((formField: any) => {
          expect(formField.formFieldId).toBeUndefined();
        });
      });
    });
  });
});
