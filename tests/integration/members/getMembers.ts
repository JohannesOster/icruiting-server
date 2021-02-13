import request from 'supertest';
import {internet, random} from 'faker';
import app from 'infrastructure/http';
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

jest.mock('aws-sdk', () => ({
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
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
