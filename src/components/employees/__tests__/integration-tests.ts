import request from 'supertest';
import faker from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/utils';
import {dbInsertOrganization} from 'components/organizations';
import fake from 'tests/fake';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

type adminCreateUserParams = {
  UserPoolId: string;
  Username: string;
  UserAttributes: Array<{Name: string; Value: string}>;
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
  const fakeOrg = fake.organization(mockUser.orgID);
  await dbInsertOrganization(fakeOrg);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('employees', () => {
  describe('POST /employees', () => {
    it('Returns 201 json response', (done) => {
      request(app)
        .post('/employees')
        .send({email: faker.internet.email()})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created user', async () => {
      const email = faker.internet.email();
      const resp = await request(app)
        .post('/employees')
        .send({email})
        .set('Accept', 'application/json')
        .expect(201);

      const expectAttributes = [
        {Name: 'email', Value: email},
        {Name: 'custom:orgID', Value: mockUser.orgID},
        {Name: 'custom:role', Value: 'employee'},
      ];

      expect(resp.body.User.Username).toBe(email);
      expect(resp.body.User.Attributes).toStrictEqual(expectAttributes);
    });
  });
});
