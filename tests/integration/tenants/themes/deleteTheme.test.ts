import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import db from 'infrastructure/db';
import fake from '../../testUtils/fake';
import dataGenerator from '../../testUtils/dataGenerator';

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
    deleteObjects: () => ({
      promise: () => Promise.resolve(),
    }),
  })),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('tenants', () => {
  describe('DELETE /tenants/:tenantId/themes', () => {
    beforeEach(async () => {
      await db.tenants.updateTheme(mockUser.tenantId, 'mockTheme.css');
    });

    it('returns 200 json response', async (done) => {
      request(app)
        .delete(`/tenants/${mockUser.tenantId}/themes`)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes theme column', async () => {
      await request(app)
        .delete(`/tenants/${mockUser.tenantId}/themes`)
        .expect('Content-Type', /json/)
        .expect(200);

      const tenant = await db.tenants.retrieve(mockUser.tenantId);
      expect(tenant!.theme).toBeNull();
    });

    it('returns 404 if theme does not exist', async (done) => {
      db.tenants.updateTheme(mockUser.tenantId, null);
      request(app)
        .delete(`/tenants/${mockUser.tenantId}/themes`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
});
