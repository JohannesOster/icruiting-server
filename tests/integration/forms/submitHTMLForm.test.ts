import {random, internet} from 'faker';
import request from 'supertest';
import app from 'infrastructure/http';
import {endConnection, truncateAllTables} from 'infrastructure/db/setup';
import dataGenerator from '../testUtils/dataGenerator';
import {Form} from 'domain/entities';

jest.mock('adapters/forms/utils');
jest.mock('infrastructure/mailservice/mailservice');

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
  describe('POST /forms/:formId/html', () => {
    let form: Form;
    beforeAll(async () => {
      form = await dataGenerator.insertForm(tenantId, jobId, 'application');
    });

    it('renders html without crashing', (done) => {
      request(app)
        .post(`/forms/${form.formId}/html`)
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });

    it('renders html without crashing', (done) => {
      request(app)
        .post(`/forms/${form.formId}/html`)
        .field(form.formFields[0].formFieldId, internet.email())
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(200, done);
    });
  });
});
