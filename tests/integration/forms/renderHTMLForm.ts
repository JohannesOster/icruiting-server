import {random} from 'faker';
import request from 'supertest';
import app from 'app';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Form} from 'infrastructure/db/repos/forms';

let tenantId: string;
let jobId: string;
beforeAll(async () => {
  tenantId = (await dataGenerator.insertTenant(random.uuid())).tenantId;
  jobId = (await dataGenerator.insertJob(tenantId)).jobId;
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
        .get(`/forms/${form.formId}/html`)
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });
  });
});
