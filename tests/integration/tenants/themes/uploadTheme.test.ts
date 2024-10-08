import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import fake from '../../testUtils/fake';
import dataGenerator from '../../testUtils/dataGenerator';

const mockUser = fake.user();
jest.mock('shared/infrastructure/http/middlewares/auth', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

beforeAll(async () => {
  await dataGenerator.insertTenant(mockUser.tenantId);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('tenants', () => {
  describe('POST /tenants/:tenantId/themes', () => {
    it('returns 201 json response', async () => {
      await request(app)
        .post(`/tenants/${mockUser.tenantId}/themes`)
        .attach('theme', `${__dirname}/files/theme.css`)
        .expect('Content-Type', /json/)
        .expect(201, {message: 'Successfully uploaded theme'});
    });

    it('validates file type', async () => {
      await request(app)
        .post(`/tenants/${mockUser.tenantId}/themes`)
        .set('Content-Type', 'multipart/form-data')
        .attach('theme', `${__dirname}/files/theme.txt`)
        .expect('Content-Type', /json/)
        .expect(422);
    });
  });
});
