import request from 'supertest';
import app from '../app';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import db from '../db';
import fake from './fake';

jest.mock('../middlewares/auth');

let jobId: string;
beforeAll(async (done) => {
  await createAllTables();
  /* Insert organization with the id set in .env file 
     This is neccessary since all routes get their orgID
     from the token payload in the auth middleware. The mock
     of this middleware also accesses process.env.TEST_ORG_ID
  */
  const organization = fake.organization(process.env.TEST_ORG_ID);
  await db.none('INSERT INTO organization VALUES ($1, $2)', [
    organization.organization_id,
    organization.organization_name,
  ]);

  const job = fake.job(organization.organization_id);
  const {
    job_id,
  } = await db.one(
    'INSERT INTO job(organization_id, job_title) VALUES ($1, $2) RETURNING job_id',
    [job.organization_id, job.job_title],
  );
  jobId = job_id;

  done();
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

describe('GET /applicants', () => {
  it('Returns 200 json response', (done) => {
    request(app)
      .get('/applicants')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});
