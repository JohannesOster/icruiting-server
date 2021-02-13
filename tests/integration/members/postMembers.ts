import request from 'supertest';
import {internet} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../testUtils/fake';
import dataGenerator from '../testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

type adminCreateUserParams = {
  UserPoolId: string;
  Username: string;
  UserAttributes: {Name: string; Value: string}[];
};
jest.mock('aws-sdk', () => ({
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
    adminCreateUser: (parmas: adminCreateUserParams) => ({
      promise: () =>
        Promise.resolve({
          User: {
            Username: parmas.Username,
            Attributes: parmas.UserAttributes,
          },
        }),
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

describe('members', () => {
  describe('POST /members', () => {
    it('Returns 201 json response', (done) => {
      request(app)
        .post('/members')
        .send({emails: [internet.email()]})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created user', async () => {
      const emails = [internet.email()];
      const resp = await request(app)
        .post('/members')
        .send({emails})
        .set('Accept', 'application/json')
        .expect(201);

      const expectAttributes = [
        {Name: 'email', Value: emails[0]},
        {Name: 'custom:tenant_id', Value: mockUser.tenantId},
        {Name: 'custom:user_role', Value: 'member'},
      ];

      expect(resp.body[0].User.Username).toBe(emails[0]);
      expect(resp.body[0].User.Attributes).toStrictEqual(expectAttributes);
    });
  });
});
