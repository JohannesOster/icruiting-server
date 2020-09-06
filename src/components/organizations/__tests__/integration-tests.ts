import request from 'supertest';
import app from 'app';
import db from 'db';
import faker from 'faker';
import {endConnection, truncateAllTables} from 'db/utils';
import fake from 'tests/fake';
import {dbInsertOrganization} from '../database';

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
                {Name: 'custom:orgID', Value: mockUser.orgID},
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

describe('organizations', () => {
  describe('POST /organizations', () => {
    it('returns 201 json response', async (done) => {
      request(app)
        .post('/organizations')
        .set('Accept', 'application/json')
        .send(fake.organization())
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('returns 422 on missing params', async (done) => {
      request(app)
        .post('/organizations')
        .set('Accept', 'application/json')
        .expect(422, done);
    });

    it('returns inserts organization entity', async () => {
      const organization = fake.organization();
      const resp = await request(app)
        .post('/organizations')
        .set('Accept', 'application/json')
        .send(organization)
        .expect(201);

      const stmt = 'SELECT * FROM organization WHERE organization_id=$1';
      const result = await db.one(stmt, resp.body.organization_id);

      expect(result.organization_name).toBe(organization.organization_name);
      expect(!!result.organization_id).toBe(true);
    });
  });

  describe('DELETE /organizations', () => {
    beforeEach(async () => {
      const fakeOrg = fake.organization(mockUser.orgID);
      await dbInsertOrganization(fakeOrg);
    });
    afterEach(async () => await db.none('TRUNCATE organization CASCADE'));

    it('returns 200 json response', (done) => {
      request(app)
        .del(`/organizations`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('deletes organization of authenticated user', async () => {
      const query =
        'SELECT COUNT(*) FROM organization WHERE organization_id=$1';
      const {count} = await db.one(query, mockUser.orgID);
      expect(parseInt(count)).toBe(1);

      await request(app)
        .del(`/organizations`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const {count: countAfter} = await db.one(query, mockUser.orgID);
      expect(parseInt(countAfter)).toBe(0);
    });
  });
});
