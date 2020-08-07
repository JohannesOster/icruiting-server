import request from 'supertest';
import app from '../app';
import db from '../db';
import fake from './fake';
import {endConnection, truncateAllTables} from '../db/utils';
import {insertJob} from '../db/jobs.db';
import {insertOrganization} from '../db/organizations.db';

const mockUser = fake.user();
jest.mock('../middlewares/auth', () => ({
  requireAdmin: jest.fn(),
  requireAuth: jest.fn((_, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

/**
 * Creates:
 *  ac.job_ref,
 *  ac.org_ref,
 *  ac_ex.ac_ref,
 */
let job: any;
beforeAll(async () => {
  const organization = fake.organization(mockUser.orgID);
  await insertOrganization(organization);

  const fakeJob = fake.job(organization.organization_id);
  job = await insertJob(fakeJob);
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('POST /:job_id/assessment-centers', () => {
  it('Returns 201 json response', (done) => {
    const ac = {};

    request(app)
      .post(`/:${job.job_id}/assessment-centers`)
      .set('Accept', 'application/json')
      .send(ac)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });
});
