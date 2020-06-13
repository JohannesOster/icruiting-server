import request from 'supertest';
import app from '../app';
import fake from './fake';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import db from '../db';

beforeAll((done) => {
  createAllTables().finally(done);
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

describe('organizations', () => {
  describe('POST /organizations', () => {
    it('Returns 202 json response', (done) => {
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
      const result = await db.any(stmt, resp.body.organization_id);

      expect(result.length).toBe(1);
      expect(result[0].organization_name).toBe(organization.organization_name);
      expect(!!result[0].organization_id).toBe(true);
      done();
    });
  });
});
