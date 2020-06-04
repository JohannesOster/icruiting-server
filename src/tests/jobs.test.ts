import request from 'supertest';
import app from '../app';
import faker from 'faker';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import db from '../db';

jest.mock('../middlewares/auth');

beforeAll(async (done) => {
  await createAllTables();
  /* Insert organization with the id set in .env file 
     This is neccessary since all routes get their orgID
     from the token payload in the auth middleware. The mock
     of this middleware also accesses process.env.TEST_ORG_ID
  */
  await db.none('INSERT INTO organization VALUES ($1, $2)', [
    process.env.TEST_ORG_ID,
    faker.company.companyName,
  ]);
  done();
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

describe('POST /jobs', () => {
  it('Returns 202 json response', (done) => {
    const job = {
      job_title: faker.company.companyName(),
      requirements: [
        {requirement_label: faker.commerce.productName()},
        {requirement_label: faker.commerce.productName()},
      ],
    };
    request(app)
      .post('/jobs')
      .set('Accept', 'application/json')
      .send(job)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('Returns created job entity as json object', async (done) => {
    const job = {
      job_title: faker.company.companyName(),
      requirements: [
        {requirement_label: faker.commerce.productName()},
        {requirement_label: faker.commerce.productName()},
      ],
    };
    const resp = await request(app)
      .post('/jobs')
      .set('Accept', 'application/json')
      .send(job)
      .expect(201);
    expect(resp.body.requirements.length).toBe(job.requirements.length);
    expect(resp.body.job_title).toBe(job.job_title);
    done();
  });

  it('Actually inserts job enitity', async (done) => {
    const job = {
      job_title: faker.company.companyName(),
      requirements: [
        {requirement_label: faker.commerce.productName()},
        {requirement_label: faker.commerce.productName()},
      ],
    };
    const resp = await request(app)
      .post('/jobs')
      .set('Accept', 'application/json')
      .send(job)
      .expect(201);
    const {job_id} = resp.body;

    const stmt = 'SELECT COUNT(*) FROM job WHERE job_id=$1';
    const {count} = await db.one(stmt, job_id);
    expect(parseInt(count)).toBe(1);

    done();
  });
});
