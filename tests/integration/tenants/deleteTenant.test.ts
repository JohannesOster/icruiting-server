import request from 'supertest';
import app from 'infrastructure/http';
import db from 'infrastructure/db';
import faker from 'faker';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
    listUsers: () => ({
      promise: () =>
        Promise.resolve({
          Users: [
            {
              Username: faker.internet.email(),
              Attributes: [
                {Name: 'email', Value: faker.internet.email()},
                {Name: 'custom:tenant_id', Value: mockUser.tenantId},
              ],
            },
          ],
        }),
    }),
    adminDeleteUser: () => ({
      promise: () => Promise.resolve({}),
    }),
  })),
}));

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('tenants', () => {
  describe('DELETE /tenants/:tenantId', () => {
    beforeEach(async () => {
      await dataGenerator.insertTenant(mockUser.tenantId);
    });

    it('returns 200 json response', (done) => {
      mockUser.userRole = 'member';
      request(app)
        .del(`/tenants/${mockUser.tenantId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes tenant of authenticated user', async () => {
      const stmt = 'SELECT COUNT(*) FROM tenant WHERE tenant_id=$1';
      const {count} = await db.one(stmt, mockUser.tenantId);
      expect(parseInt(count, 10)).toBe(1);

      await request(app)
        .del(`/tenants/${mockUser.tenantId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const {count: countAfter} = await db.one(stmt, mockUser.tenantId);
      expect(parseInt(countAfter, 10)).toBe(0);
    });

    it('uses tenantId of jwt not parameter', async () => {
      const {id: tenantId} = await dataGenerator.insertTenant(faker.random.uuid());

      await request(app)
        .del(`/tenants/${tenantId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const stmt = 'SELECT COUNT(*) FROM tenant WHERE tenant_id=$1';
      const {count} = await db.one(stmt, tenantId);
      expect(parseInt(count, 10)).toBe(1);
    });
  });
});
