import request from 'supertest';
import app from '../app';
import fake from './fake';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import {insertJob} from '../db/jobs.db';
import db from '../db';

jest.mock('../middlewares/auth');

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
  done();
});

beforeEach(async (done) => {
  await db.none('DELETE FROM job');
  done();
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

describe('POST /jobs', () => {
  const organizationId = process.env.TEST_ORG_ID || '';
  it('Returns 202 json response', (done) => {
    const job = fake.job(organizationId);
    request(app)
      .post('/jobs')
      .set('Accept', 'application/json')
      .send(job)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('Returns created job entity as json object', async (done) => {
    const job = fake.job(organizationId);
    const resp = await request(app)
      .post('/jobs')
      .set('Accept', 'application/json')
      .send(job)
      .expect(201);
    expect(resp.body.job_requirements.length).toBe(job.job_requirements.length);
    expect(resp.body.job_title).toBe(job.job_title);
    done();
  });

  it('Actually inserts job enitity', async (done) => {
    const job = fake.job(organizationId);
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

describe('GET /jobs', () => {
  it('Returns 200 json response', async (done) => {
    request(app)
      .get('/jobs')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('Returns empty array if ther are no jobs', async (done) => {
    const resp = await request(app)
      .get('/jobs')
      .set('Accept', 'application/json')
      .expect(200);

    expect(resp.body.length).toBe(0);

    done();
  });

  it('Returns arra of jobs with its job_requirements', async (done) => {
    const job = fake.job(process.env.TEST_ORG_ID || '');
    await insertJob(job);

    const resp = await request(app)
      .get('/jobs')
      .set('Accept', 'application/json')
      .expect(200);

    expect(resp.body.length).toBe(1);
    expect(resp.body[0].job_title).toBe(job.job_title);
    const requirementLabels = job.job_requirements.map(
      (req) => req.requirement_label,
    );
    resp.body[0].job_requirements.forEach((req: any) => {
      expect(requirementLabels.includes(req.requirement_label)).toBe(true);
    });

    done();
  });
});
