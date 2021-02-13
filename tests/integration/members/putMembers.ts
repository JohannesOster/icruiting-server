import request from 'supertest';
import {internet} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
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

type AdminUpdateUserParams = {
  UserPoolId: string;
  Username: string;
  UserAttributes: {Name: string; Value: string}[];
};
jest.mock('aws-sdk', () => ({
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
    adminUpdateUserAttributes: (params: AdminUpdateUserParams) => ({
      promise: () =>
        Promise.resolve({
          Username: params.Username,
          Attributes: params.UserAttributes,
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
  describe('PUT /members/:username', () => {
    it('Returns 200 json response', (done) => {
      request(app)
        .put(`/members/${internet.email()}`)
        .set('Accept', 'application/json')
        .send({user_role: 'admin'})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated User', async () => {
      const email = internet.email();
      const resp = await request(app)
        .put(`/members/${email}`)
        .set('Accept', 'application/json')
        .send({user_role: 'admin'})
        .expect(200);

      const expectAttributes = [{Name: 'custom:user_role', Value: 'admin'}];
      expect(resp.body.Attributes).toStrictEqual(expectAttributes);
    });

    it('Validates userRole param', (done) => {
      request(app)
        .put(`/members/${internet.email()}`)
        .set('Accept', 'application/json')
        .send({user_role: 'invalid role'})
        .expect(422, done);
    });
  });
});
