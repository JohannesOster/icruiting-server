import request from 'supertest';
import {internet, random} from 'faker';
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
    listUsers: () => ({
      promise: () =>
        Promise.resolve({
          Users: [
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:orgID', Value: mockUser.orgID},
                {Name: 'custom:role', Value: 'employee'},
              ],
            },
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:orgID', Value: mockUser.orgID},
                {Name: 'custom:role', Value: 'admin'},
              ],
            },
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:orgID', Value: random.uuid()},
                {Name: 'custom:role', Value: 'employee'},
              ],
            },
          ],
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
        .send({email: internet.email()})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created user', async () => {
      const email = internet.email();
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

  describe('GET /employees', () => {
    it('Returns 200 json response', (done) => {
      request(app)
        .get('/employees')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Removes custom keywoard before custom attributes', async () => {
      const resp = await request(app)
        .get('/employees')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((user: any) => {
        expect(user.email).toBeDefined();
        expect(user.orgID).toBeDefined();
        expect(user.role).toBeDefined();
      });
    });

    it('Isolates organization employees', async () => {
      const resp = await request(app)
        .get('/employees')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((user: any) => {
        expect(user.orgID).toBe(mockUser.orgID);
      });
    });
  });
});
