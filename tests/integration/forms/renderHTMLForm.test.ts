import {random} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Form} from 'modules/forms/domain';

let tenantId: string;
let jobId: string;
beforeAll(async () => {
  tenantId = (await dataGenerator.insertTenant(random.uuid())).id;
  jobId = (await dataGenerator.insertJob(tenantId)).id;
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('forms', () => {
  describe('GET /forms/:formId/html', () => {
    let form: Form;
    beforeAll(async () => {
      form = await dataGenerator.insertForm(tenantId, jobId, 'application');
    });

    it('renders html without crashing', (done) => {
      request(app)
        .get(`/forms/${form.id}/html`)
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });
  });
});
