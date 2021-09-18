import request from 'supertest';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';
import {random} from 'faker';
import {Form} from 'modules/forms/domain';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
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

describe('forms', () => {
  describe('DELETE /forms/:formId', () => {
    let form: Form;
    beforeEach(async () => {
      form = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'application',
      );
    });

    it('returns json 200 response', (done) => {
      request(app)
        .delete(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes form', async () => {
      const {count: countBefore} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.id,
      );

      expect(parseInt(countBefore, 10)).toBe(1);

      await request(app)
        .delete(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.id,
      );

      expect(parseInt(count, 10)).toBe(0);
    });

    it('isolates tenant', async () => {
      const {id: tenantId} = await dataGenerator.insertTenant(random.uuid());
      const form = await dataGenerator.insertForm(
        tenantId,
        jobId,
        'application',
      );

      await request(app)
        .delete(`/forms/${form.id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        form.id,
      );

      expect(parseInt(count, 10)).toBe(1);
    });

    it('deletes replicas', async () => {
      const primary = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'onboarding',
      );

      const replica = await dataGenerator.insertForm(
        mockUser.tenantId,
        jobId,
        'onboarding',
        {replicaOf: primary.id},
      );

      await request(app)
        .delete(`/forms/${primary.id}`)
        .set('Accept', 'application/json')
        .expect(200);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM form WHERE form_id=$1',
        replica.id,
      );

      expect(parseInt(count, 10)).toBe(0);
    });
  });
});
