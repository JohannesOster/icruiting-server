import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import db, {pgp} from 'infrastructure/db';
import fake from '../../testUtils/fake';
import dataGenerator from '../../testUtils/dataGenerator';
import {TenantsRepository} from 'modules/tenants/infrastructure/repositories/tenantsRepository';

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
    deleteObject: () => ({promise: () => Promise.resolve()}),
  })),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

const tenantsRepo = TenantsRepository({db, pgp});

describe('tenants', () => {
  describe('DELETE /tenants/:tenantId/themes', () => {
    beforeEach(async () => {
      await tenantsRepo.updateTheme(mockUser.tenantId, 'mockTheme.css');
    });

    it('returns 200 json response', async () => {
      await request(app)
        .delete(`/tenants/${mockUser.tenantId}/themes`)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('deletes theme column', async () => {
      await request(app)
        .delete(`/tenants/${mockUser.tenantId}/themes`)
        .expect('Content-Type', /json/)
        .expect(200);

      const tenant = await tenantsRepo.retrieve(mockUser.tenantId);
      expect(tenant!.theme).toBeUndefined();
    });

    it('returns 404 if theme does not exist', async () => {
      tenantsRepo.updateTheme(mockUser.tenantId, null);
      await request(app)
        .delete(`/tenants/${mockUser.tenantId}/themes`)
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});
