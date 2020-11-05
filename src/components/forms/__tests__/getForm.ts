import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'testUtils/fake';
import dataGenerator from 'testUtils/dataGenerator';
import {random} from 'faker';
import {Form} from 'db/repos/forms';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobId: string;
beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
  jobId = (await dataGenerator.insertJob(mockUser.tenantId)).jobId;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('forms', () => {
  describe('GET /forms', () => {
    let form: Form;
    beforeAll(async () => {
      const {tenantId} = mockUser;
      form = await dataGenerator.insertForm(tenantId, jobId, 'application');
    });
    it('returns 200 json response', (done) => {
      request(app)
        .get(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('returns single form if exists', async () => {
      const resp = await request(app)
        .get(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(resp.body).toStrictEqual(form);
    });

    it('returns 404 if form does not exist', async () => {
      await request(app)
        .get(`/forms/${random.uuid()}`)
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('isolates tenant', async () => {
      const {tenantId} = await dataGenerator.insertTenant(random.uuid());
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );

      await request(app)
        .get(`/forms/${form.formId}`)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
