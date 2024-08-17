import request from 'supertest';
import app from 'infrastructure/http';
import faker from 'faker';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import {CognitoUserAttribute} from 'amazon-cognito-identity-js';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
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
  describe('POST /tenants', () => {
    const params = (tenant = fake.tenant()) => ({
      ...tenant,
      email: faker.internet.email(),
      password: faker.internet.password(),
      stripePriceId: faker.random.uuid(),
    });
    it('returns 201 json response', async () => {
      await request(app)
        .post('/tenants')
        .set('Accept', 'application/json')
        .send(params())
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('returns 422 on missing params', async () => {
      await request(app).post('/tenants').send({}).set('Accept', 'application/json').expect(422);
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
});
