import request from 'supertest';
import app from '../app';
import db from '../db';
import fake from './fake';
import {endConnection, truncateAllTables} from '../db/utils';
import {random} from 'faker';
import {TApplicant} from 'controllers/applicants';
import {insertForm} from '../db/forms.db';
import {insertScreening} from '../db/screenings.db';
import faker from 'faker';

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
const insert = db.$config.pgp.helpers.insert;
const randomJobId = () => {
  const randomIdx = random.number({min: 0, max: jobIds.length - 1});
  const randomJobId = jobIds[randomIdx];
  return randomJobId;
};

beforeAll(async () => {
  // insert organization
  const fakeOrg = fake.organization(mockUser.orgID);
  const orgStmt = insert(fakeOrg, null, 'organization');
  await db.none(orgStmt);

  // insert jobs
  const fakeJobs = [
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
  ];
  const columns = ['job_title', 'organization_id']; // requirements are irrelevant for these tests
  const returning = ' RETURNING job_id';
  const promises = fakeJobs.map((job) => {
    const stmt = insert(job, columns, 'job') + returning;
    return db.one(stmt);
  });

  await Promise.all(promises).then((res) => {
    jobIds = res.map((job) => job.job_id);
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
      .map(() => {
        return fake.applicant(mockUser.orgID, randomJobId());
      });

    const returning = ' RETURNING *';
    const promises = fakeApplicants.map((applicant) => {
      const stmt = insert(applicant, null, 'applicant') + returning;
      return db.one(stmt);
    });

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
    const {form_id} = await insertForm(
      fake.screeningForm(mockUser.orgID, randomJobId()),
    );

    // insert screening for single applicant
    const randomApplIdx = random.number({min: 0, max: applicants.length - 1});
    const randomApplId = applicants[randomApplIdx].applicant_id;

    const range = {min: 0, max: 5};
    const screening = {
      form_id,
      applicant_id: randomApplId,
      submitter_id: mockUser.sub,
      organization_id: mockUser.orgID,
      comment: random.words(),
      submission: {
        [random.uuid()]: random.number(range),
        [random.uuid()]: random.number(range),
        [random.uuid()]: random.number(range),
        [random.uuid()]: random.number(range),
      },
    };
    await insertScreening(screening);

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
