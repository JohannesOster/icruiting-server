import request from 'supertest';
import db from 'infrastructure/db';
import app from 'infrastructure/http';
import fake from '../../testUtils/fake';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../../testUtils/dataGenerator';
import {Form} from 'domain/entities';
import * as jsonJob from './files/job.json';

const mockUser = fake.user();
jest.mock('infrastructure/http/middlewares/auth', () => ({
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

describe('jobs', () => {
  afterEach(async () => {
    await db.none('TRUNCATE job CASCADE');
  });

  describe('POST /jobs/import', () => {
    it('Returns 201 json response', async (done) => {
      request(app)
        .post(`/jobs/import`)
        .set('Accept', 'application/json')
        .attach('job', `${__dirname}/files/job.json`)
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Validates filetype', async () => {
      const {body} = await request(app)
        .post(`/jobs/import`)
        .set('Accept', 'application/json')
        .attach('job', `${__dirname}/files/job.txt`)
        .expect('Content-Type', /json/)
        .expect(422);
      expect(body.message).toBe('Invalid fileformat txt');
    });

    it('Returns inserted job', async () => {
      const {body} = await request(app)
        .post(`/jobs/import`)
        .set('Accept', 'application/json')
        .attach('job', `${__dirname}/files/job.json`)
        .expect('Content-Type', /json/)
        .expect(201);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM job WHERE job_id=$1',
        body.jobId,
      );
      expect(parseInt(count, 10)).toBe(1);
    });

    it('Returns inserted jobRequirements', async () => {
      const {body} = await request(app)
        .post(`/jobs/import`)
        .set('Accept', 'application/json')
        .attach('job', `${__dirname}/files/job.json`)
        .expect('Content-Type', /json/)
        .expect(201);

      const {count} = await db.one(
        'SELECT COUNT(*) FROM job_requirement WHERE job_id=$1',
        body.jobId,
      );
      expect(parseInt(count, 10)).toBe(jsonJob.jobRequirements.length);
    });

    it('Returns inserted forms', async () => {
      const {body} = await request(app)
        .post(`/jobs/import`)
        .set('Accept', 'application/json')
        .attach('job', `${__dirname}/files/job.json`)
        .expect('Content-Type', /json/)
        .expect(201);

      const promises: Promise<any>[] = body.forms.map(({formId}: Form) => {
        return db
          .one('SELECT COUNT(*) FROM form WHERE form_id=$1', formId)
          .then(({count}) => count);
      });

      await Promise.all(promises).then((counts) => {
        counts.forEach((count) => {
          expect(parseInt(count, 10)).toBe(1);
        });
      });
    });
  });
});
