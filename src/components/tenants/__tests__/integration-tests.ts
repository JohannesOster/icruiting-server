import request from 'supertest';
import app from 'app';
import db from 'db';
import faker from 'faker';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'testUtils/fake';
import dataGenerator from 'testUtils/dataGenerator';
import {CognitoUserAttribute} from 'amazon-cognito-identity-js';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

jest.mock('amazon-cognito-identity-js', () => ({
  CognitoUserAttribute: jest.fn().mockImplementation((args: any) => args),
  CognitoUserPool: jest.fn().mockImplementation(() => ({
    signUp: (
      email: string,
      _passwort: string,
      attributes: CognitoUserAttribute[],
      _validationData: CognitoUserAttribute[],
      callback: (error: any, result: any) => void,
    ) => {
      callback(null, {
        User: {
          Username: email,
          Attributes: attributes,
        },
      });
    },
  })),
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
    adminCreateUser: (parmas: {
      UserPoolId: string;
      Username: string;
      UserAttributes: {Name: string; Value: string}[];
    }) => ({
      promise: () =>
        Promise.resolve({
          User: {
            Username: parmas.Username,
            Attributes: parmas.UserAttributes,
          },
        }),
    }),
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
  const params = (tenant = fake.tenant()) => ({
    ...tenant,
    email: faker.internet.email(),
    password: faker.internet.password(),
    name: faker.name.lastName(),
    stripePriceId: faker.random.uuid(),
  });
  describe('POST /tenants', () => {
    it('returns 201 json response', async (done) => {
      request(app)
        .post('/tenants')
        .set('Accept', 'application/json')
        .send(params())
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
      const {body} = await request(app)
        .post('/tenants')
        .set('Accept', 'application/json')
        .send(params(tenant))
        .expect(201);

      expect(body.tenant.tenantName).toBe(tenant.tenantName);
      expect(!!body.tenant.tenantId).toBe(true);
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
      expect(parseInt(count, 10)).toBe(1);

      await request(app)
        .del(`/tenants`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const {count: countAfter} = await db.one(stmt, mockUser.tenantId);
      expect(parseInt(countAfter, 10)).toBe(0);
    });
  });
});
