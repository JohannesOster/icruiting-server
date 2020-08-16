import request from 'supertest';
import app from '../app';
import db from '../db';
import fake from './fake';
import {endConnection, truncateAllTables} from '../db/utils';
import {random} from 'faker';
import {TApplicant} from 'controllers/applicants';
import {TForm} from 'controllers/forms';
import {insertForm} from '../db/forms.db';
import {insertFormSubmission} from '../db/formSubmissions.db';
import faker from 'faker';
import {insertApplicant} from '../db/applicants.db';
import {insertOrganization} from '../db/organizations.db';
import {insertJob} from '../db/jobs.db';

const mockUser = fake.user();
jest.mock('../middlewares/auth', () => ({
  requireAdmin: jest.fn(),
  requireAuth: jest.fn((_, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobIds: string[];

/* HELPER FUNCTIONS */
const randomJobId = () => {
  const randomIdx = random.number({min: 0, max: jobIds.length - 1});
  const randomJobId = jobIds[randomIdx];
  return randomJobId;
};

beforeAll(async () => {
  // insert organization
  const fakeOrg = fake.organization(mockUser.orgID);
  await insertOrganization(fakeOrg);

  // insert jobs
  const fakeJobs = [
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
  ];
  const promises = fakeJobs.map((job) => insertJob(job));

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
    const applicantsCount = faker.random.number({min: 50, max: 100});
    const fakeApplicants = Array(applicantsCount)
      .fill(0)
      .map(() => fake.applicant(mockUser.orgID, randomJobId()));

    const promises = fakeApplicants.map((appl) => insertApplicant(appl));

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
    const jobId = randomJobId();
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
    const fakeForm = fake.screeningForm(mockUser.orgID, randomJobId());
    const form: TForm = await insertForm(fakeForm);

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

    await insertFormSubmission(screening);

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
