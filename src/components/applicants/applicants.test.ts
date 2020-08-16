import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/utils';
import {TApplicant} from './types';
import {dbInsertApplicant} from './database';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertFormSubmission} from 'components/formSubmissions';
import {dbInsertOrganization} from 'components/organizations';
import {dbInsertJob} from 'components/jobs';
import fake from 'tests/fake';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn(),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobIds: string[];

const getRandomJobId = () => {
  const randomIdx = random.number({min: 0, max: jobIds.length - 1});
  const randomJobId = jobIds[randomIdx];
  return randomJobId;
};

beforeAll(async () => {
  // insert organization
  const fakeOrg = fake.organization(mockUser.orgID);
  await dbInsertOrganization(fakeOrg);

  // insert jobs
  const fakeJobs = [
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
  ];
  const promises = fakeJobs.map((job) => dbInsertJob(job));

  await Promise.all(promises).then((res) => {
    jobIds = res.map(({job_id}) => job_id);
  });
});

afterAll(async () => {
  await truncateAllTables();
  endConnection();
});

describe('GET /applicants', () => {
  let applicants: TApplicant[] = [];
  beforeAll(async () => {
    const applicantsCount = random.number({min: 50, max: 100});
    const fakeApplicants = Array(applicantsCount)
      .fill(0)
      .map(() => fake.applicant(mockUser.orgID, getRandomJobId()));

    const promises = fakeApplicants.map((appl) => dbInsertApplicant(appl));

    applicants = await Promise.all(promises);
  });

  it('Returns 200 json response', (done) => {
    request(app)
      .get('/applicants')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('Returns unfiltered array of applicants', async (done) => {
    const res = await request(app)
      .get('/applicants')
      .set('Accept', 'application/json')
      .expect(200);
    expect(res.body.length).toBe(applicants.length);
    done();
  });

  it('Filters by job_id using query', async (done) => {
    const jobId = getRandomJobId();
    const res = await request(app)
      .get('/applicants?job_id=' + jobId)
      .set('Accept', 'application/json')
      .expect(200);

    // filter manually to check request results
    const filteredAppl = applicants.filter((appl) => appl.job_id === jobId);
    expect(res.body.length).toBe(filteredAppl.length);

    done();
  });

  it('Includes boolean weather screening exists or not', async (done) => {
    const fakeForm = fake.screeningForm(mockUser.orgID, getRandomJobId());
    const form: TForm = await dbInsertForm(fakeForm);

    // insert screening for single applicant
    const randomApplIdx = random.number({min: 0, max: applicants.length - 1});
    const randomApplId = applicants[randomApplIdx].applicant_id;

    const screening = {
      form_id: form.form_id!,
      applicant_id: randomApplId!,
      submitter_id: mockUser.sub,
      organization_id: mockUser.orgID,
      comment: random.words(),
      submission: form.form_items.reduce(
        (acc: {[form_item_id: string]: string}, item) => {
          acc[item.form_item_id!] = random.number({min: 0, max: 5}).toString();
          return acc;
        },
        {},
      ),
    };

    await dbInsertFormSubmission(screening);

    const res = await request(app)
      .get('/applicants')
      .set('Accept', 'application/json')
      .expect(200);

    const filtered = res.body.filter((appl: any) => appl.screening_exists);
    expect(filtered.length).toBe(1);
    expect(filtered[0].applicant_id).toBe(randomApplId);

    done();
  });
});
