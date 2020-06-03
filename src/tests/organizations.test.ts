import request from 'supertest';
import app from '../app';
import {selectOrganization} from '../db/organizations.db';
import faker from 'faker';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';

beforeAll(async (done) => {
  await createAllTables();
  done();
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

describe('POST /organizations', () => {
  it('Returns 202 json response', (done) => {
    const organization = {
      organization_name: faker.company.companyName(),
    };
    request(app)
      .post('/organizations')
      .set('Accept', 'application/json')
      .send(organization)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('Returns inserts store entity', async (done) => {
    const organization = {
      organization_name: faker.company.companyName(),
    };
    const resp = await request(app)
      .post('/organizations')
      .set('Accept', 'application/json')
      .send(organization)
      .expect('Content-Type', /json/)
      .expect(201);

    const org = await selectOrganization(resp.body.organization_id);
    expect(org.organization_name).toBe(organization.organization_name);
    done();
  });

  it('Returns 422 on missing params', (done) => {
    request(app)
      .post('/organizations')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(422, done);
  });
});
