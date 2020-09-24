import request from 'supertest';
import app from 'app';
import db from 'db';
import faker from 'faker';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'tests/fake';
import dataGenerator from 'tests/dataGenerator';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    listObjects: () => ({
      promise: () => Promise.resolve({Contents: [{Key: faker.internet.url()}]}),
    }),
    deleteObjects: () => ({
      promise: () => Promise.resolve(),
    }),
  })),
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
    listUsers: () => ({
      promise: () =>
        Promise.resolve({
          Users: [
            {
              Username: faker.internet.email(),
              Attributes: [
                {Name: 'email', Value: faker.internet.email()},
                {Name: 'custom:tenantId', Value: mockUser.tenantId},
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
  describe('POST /tenants', () => {
    it('returns 201 json response', async (done) => {
      request(app)
        .post('/tenants')
        .set('Accept', 'application/json')
        .send(fake.tenant())
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns 422 on missing params', async (done) => {
      request(app)
        .post('/tenants')
        .send({})
        .set('Accept', 'application/json')
        .expect(422, done);
    });

    it('returns inserted tenant entity', async () => {
      const tenant = fake.tenant();
      const resp = await request(app)
        .post('/tenants')
        .set('Accept', 'application/json')
        .send(tenant)
        .expect(201);
      console.log(resp.body);

      expect(resp.body.tenantName).toBe(tenant.tenantName);
      expect(!!resp.body.tenantId).toBe(true);
    });
  });

  describe('DELETE /tenants', () => {
    beforeEach(async () => {
      await dataGenerator.insertTenant(mockUser.tenantId);
    });

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/tenants`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes tenant of authenticated user', async () => {
      const stmt = 'SELECT COUNT(*) FROM tenant WHERE tenant_id=$1';
      const {count} = await db.one(stmt, mockUser.tenantId);
      expect(parseInt(count)).toBe(1);

      await request(app)
        .del(`/tenants`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const {count: countAfter} = await db.one(stmt, mockUser.tenantId);
      expect(parseInt(countAfter)).toBe(0);
    });
  });
});
