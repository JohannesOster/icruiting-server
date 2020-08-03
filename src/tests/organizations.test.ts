import request from 'supertest';
import app from '../app';
import fake from './fake';
import {endConnection, truncateAllTables} from '../db/utils';
import db from '../db';

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('organizations', () => {
  describe('POST /organizations', () => {
    it('Returns 201 json response', (done) => {
      request(app)
        .post('/organizations')
        .set('Accept', 'application/json')
        .send(fake.organization())
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('Returns 422 on missing params', (done) => {
      request(app)
        .post('/organizations')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(422, done);
    });

    it('Returns inserts organization entity', async (done) => {
      const organization = fake.organization();
      const resp = await request(app)
        .post('/organizations')
        .set('Accept', 'application/json')
        .send(organization)
        .expect('Content-Type', /json/)
        .expect(201);

      const stmt = 'SELECT * FROM organization WHERE organization_id=$1';
      const result = await db.one(stmt, resp.body.organization_id);

      expect(result.organization_name).toBe(organization.organization_name);
      expect(!!result.organization_id).toBe(true);
      done();
    });
  });
});
