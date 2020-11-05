import request from 'supertest';
import {internet, random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/setup';
import fake from 'testUtils/fake';
import dataGenerator from 'testUtils/dataGenerator';

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
    listUsers: () => ({
      promise: () =>
        Promise.resolve({
          Users: [
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:tenant_id', Value: mockUser.tenantId},
                {Name: 'custom:user_role', Value: 'member'},
              ],
            },
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:tenant_id', Value: mockUser.tenantId},
                {Name: 'custom:user_role', Value: 'admin'},
              ],
            },
            {
              Username: internet.email(),
              Attributes: [
                {Name: 'email', Value: internet.email()},
                {Name: 'custom:tenant_id', Value: random.uuid()},
                {Name: 'custom:user_role', Value: 'member'},
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

  describe('GET /members', () => {
    it('Returns 200 json response', (done) => {
      request(app)
        .get('/members')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('Removes custom keywoard before custom attributes', async () => {
      const resp = await request(app)
        .get('/members')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((user: any) => {
        expect(user.email).toBeDefined();
        expect(user.tenant_id).toBeDefined();
        expect(user.user_role).toBeDefined();
      });
    });

    it('Isolates tenant members', async () => {
      const resp = await request(app)
        .get('/members')
        .set('Accept', 'application/json')
        .expect(200);

      resp.body.forEach((user: any) => {
        expect(user.tenant_id).toBe(mockUser.tenantId);
      });
    });
  });
});
