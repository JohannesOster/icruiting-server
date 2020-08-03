import request from 'supertest';
import app from '../app';
import db, {pgp} from '../db';
import fake from './fake';
import {endConnection} from '../db/utils';
import {random} from 'faker';
import {TApplicant} from 'controllers/applicants';
import {insertForm} from '../db/forms.db';
import {insertScreening} from '../db/screenings.db';

const mockUser = fake.user();
jest.mock('../middlewares/auth', () => ({
  requireAuth: jest.fn((_, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
  requireAdmin: jest.fn(),
}));

const insert = db.$config.pgp.helpers.insert;

let jobIds: string[];
beforeAll(async (done) => {
  // insert organization
  const organization = fake.organization(mockUser.orgID);
  const orgStmt = insert(organization, null, 'organization');
  await db.none(orgStmt);

  // insert jobs
  const fakeJobs = [
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
    fake.job(mockUser.orgID),
  ];
  const columns = ['job_title', 'organization_id'];
  const promises = fakeJobs.map((job) => {
    const stmt = insert(job, columns, 'job') + ' RETURNING job_id';
    return db.one(stmt);
  });

  Promise.all(promises)
    .then((res) => {
      jobIds = res.map((job) => job.job_id);
    })
    .finally(done);
});

afterAll(() => endConnection());

describe('GET /applicants', () => {
  let applicants: TApplicant[] = [];
  beforeAll(async (done) => {
    const promises: any[] = [];
    // create 20 fake applicants
    const fakeApplicants = Array(20)
      .fill(0)
      .map(() => {
        const randomIdx = random.number({min: 0, max: jobIds.length - 1});
        const randomJobId = jobIds[randomIdx];
        return fake.applicant(mockUser.orgID, randomJobId);
      });
    fakeApplicants.forEach((applicant) => {
      const stmt = insert(applicant, null, 'applicant') + ' RETURNING *';
      promises.push(db.one(stmt));
    });
    Promise.all(promises).then((res) => {
      applicants = res;
      done();
    });
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
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(applicants.length);
    done();
  });
  it('Filters by job_id using query', async (done) => {
    const randomIdx = random.number({min: 0, max: jobIds.length - 1});
    const randomJobId = jobIds[randomIdx];
    const filteredAppl = applicants.filter(
      (appl) => appl.job_id === randomJobId,
    );
    const res = await request(app)
      .get('/applicants?job_id=' + randomJobId)
      .set('Accept', 'application/json')
      .expect(200);
    expect(res.body.length).toBe(filteredAppl.length);
    done();
  });
  it('Includes boolean weather screening exists or not', async (done) => {
    // insert screening form
    const randomIdx = random.number({min: 0, max: jobIds.length - 1});
    const randomJobId = jobIds[randomIdx];
    const {form_id} = await insertForm(
      fake.screeningForm(mockUser.orgID, randomJobId),
    );
    // insert screening for single applicant
    const randomApplIdx = random.number({min: 0, max: applicants.length - 1});
    const randomApplId = applicants[randomApplIdx].applicant_id;
    const range = {min: 0, max: 5};
    const screening = {
      form_id,
      applicant_id: randomApplId,
      submitter_id: mockUser.sub,
      submission: {
        [random.alphaNumeric()]: random.number(range),
        [random.alphaNumeric()]: random.number(range),
        [random.alphaNumeric()]: random.number(range),
        [random.alphaNumeric()]: random.number(range),
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
