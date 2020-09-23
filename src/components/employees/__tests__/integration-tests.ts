import request from 'supertest';
import {internet, random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/utils';
import {dbInsertTenant} from 'components/tenants';
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
                {Name: 'custom:tenant_id', Value: mockUser.tenant_id},
                {Name: 'custom:user_role', Value: 'employee'},
              ],
            },
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:tenant_id', Value: mockUser.tenant_id},
                {Name: 'custom:user_role', Value: 'admin'},
              ],
            },
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:tenant_id', Value: random.uuid()},
                {Name: 'custom:user_role', Value: 'employee'},
              ],
            },
          ],
        }),
    }),
    adminUpdateUserAttributes: (params: adminCreateUserParams) => ({
      promise: () =>
        Promise.resolve({
          Username: params.Username,
          Attributes: params.UserAttributes,
        }),
    }),
  })),
}));

beforeAll(async () => {
  const fakeTenant = fake.tenant(mockUser.tenant_id);
  await dbInsertTenant(fakeTenant);
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
        .send({emails: [internet.email()]})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns created user', async () => {
      const emails = [internet.email()];
      const resp = await request(app)
        .post('/employees')
        .send({emails})
        .set('Accept', 'application/json')
        .expect(201);

      const expectAttributes = [
        {Name: 'email', Value: emails[0]},
        {Name: 'custom:tenant_id', Value: mockUser.tenant_id},
        {Name: 'custom:user_role', Value: 'employee'},
      ];

      expect(resp.body[0].User.Username).toBe(emails[0]);
      expect(resp.body[0].User.Attributes).toStrictEqual(expectAttributes);
    });
  });

  describe('PUT /employees/:username', () => {
    it('Returns 200 json response', (done) => {
      request(app)
        .put(`/employees/${internet.email()}`)
        .set('Accept', 'application/json')
        .send({user_role: 'admin'})
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Returns updated User', async () => {
      const email = internet.email();
      const resp = await request(app)
        .put(`/employees/${email}`)
        .set('Accept', 'application/json')
        .send({user_role: 'admin'})
        .expect(200);

      const expectAttributes = [{Name: 'custom:user_role', Value: 'admin'}];

      expect(resp.body.Attributes).toStrictEqual(expectAttributes);
    });

    it('Validates user_role param', async () => {
      const resp = await request(app)
        .put(`/employees/${internet.email()}`)
        .set('Accept', 'application/json')
        .send({user_role: 'invalid role'})
        .expect(422);
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
        expect(user.tenant_id).toBeDefined();
        expect(user.user_role).toBeDefined();
      });
    });

    it('Isolates tenant employees', async () => {
      const resp = await request(app)
        .get('/employees')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((user: any) => {
        expect(user.tenant_id).toBe(mockUser.tenant_id);
      });
    });
  });
});
