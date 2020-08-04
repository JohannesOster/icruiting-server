import request from 'supertest';
import app from '../app';
import db from '../db';
import fake from './fake';
import {endConnection, truncateAllTables} from '../db/utils';

const mockUser = fake.user();
jest.mock('../middlewares/auth', () => ({
  requireAdmin: jest.fn(),
  requireAuth: jest.fn((_, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

beforeAll(async () => {});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('GET /:job_id/assessment-center', () => {
  it('Returns 200 json response', (done) => {});
});
