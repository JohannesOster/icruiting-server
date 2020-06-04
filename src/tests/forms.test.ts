import request from 'supertest';
import app from '../app';
import faker from 'faker';
import {createAllTables, dropAllTables, endConnection} from '../db/utils';
import db from '../db';
import {insertForm} from '../db/forms.db';

jest.mock('../middlewares/auth');

let jobId: string;
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

  const {
    job_id,
  } = await db.one(
    'INSERT INTO job(organization_id, job_title) VALUES ($1, $2) RETURNING job_id',
    [process.env.TEST_ORG_ID, faker.company.catchPhraseNoun()],
  );
  jobId = job_id;

  await db.none(
    'INSERT INTO job_requirement(job_id, requirement_label) VALUES ($1,$2)',
    [job_id, faker.company.catchPhraseAdjective()],
  );

  done();
});

afterAll(async (done) => {
  await dropAllTables();
  endConnection();
  done();
});

const getForm = () => {
  return {
    job_id: jobId,
    form_title: faker.random.words(),
    form_category: 'APPLICATION',
    form_items: [
      {
        component: 'Input',
        item_label: faker.random.word(),
        form_index: 0,
        item_validation: {required: true},
      },
      {
        component: 'Select',
        item_label: faker.random.word(),
        form_index: 1,
        item_options: [
          {label: faker.random.word(), name: faker.random.alphaNumeric()},
          {label: faker.random.word(), name: faker.random.alphaNumeric()},
          {label: faker.random.word(), name: faker.random.alphaNumeric()},
        ],
        editable: true,
        deletable: true,
      },
    ],
  };
};

describe('POST /forms', () => {
  it('Returns 201 json response', (done) => {
    request(app)
      .post('/forms')
      .set('Accept', 'application/json')
      .send(getForm())
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('Returns inserted form entity as well as form items', async (done) => {
    const form = getForm();
    const resp = await request(app)
      .post('/forms')
      .set('Accept', 'application/json')
      .send(form)
      .expect(201);

    expect(!!resp.body.form_id).toBe(true);
    expect(resp.body.form_title).toBe(form.form_title);
    expect(resp.body.form_category).toBe(form.form_category);
    expect(resp.body.form_items.length).toBe(form.form_items.length);
    done();
  });
});

describe('GET /forms', () => {
  it('Returns 200 json response', (done) => {
    request(app)
      .get('/forms')
      .set('Accept', 'application/json')
      .send(getForm())
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('Returns array of forms along with their form items', async (done) => {
    await db.none('DELETE FROM form');
    const form: any = getForm();
    form.organization_id = process.env.TEST_ORG_ID;

    const insertedForm = await insertForm(form);

    const resp = await request(app)
      .get('/forms')
      .set('Accept', 'application/json')
      .expect(200);

    expect(resp.body[0].form_id).toBe(insertedForm.form_id);
    expect(resp.body[0].form_items.length).toBe(insertedForm.form_items.length);
    done();
  });
});
