import request from 'supertest';
import {random} from 'faker';
import app from 'app';
import {endConnection, truncateAllTables} from 'db/utils';
import {TApplicant} from '../types';
import {dbInsertApplicant} from '../database';
import {TForm, dbInsertForm} from 'components/forms';
import {dbInsertFormSubmission} from 'components/formSubmissions';
import {dbInsertOrganization} from 'components/organizations';
import {dbInsertJob} from 'components/jobs';
import fake from 'tests/fake';
import {randomElement} from 'utils';

const mockUser = fake.user();
jest.mock('middlewares/auth', () => ({
  requireAdmin: jest.fn(),
  requireAuth: jest.fn((req, res, next) => {
    res.locals.user = mockUser;
    next();
  }),
}));

let jobIds: string[];
beforeAll(async () => {
  // insert organization
  const fakeOrg = fake.organization(mockUser.orgID);
  await dbInsertOrganization(fakeOrg);

  // insert jobs
  const jobsCount = random.number({min: 5, max: 20});
  const fakeJobs = Array(jobsCount)
    .fill(0)
    .map(() => fake.job(mockUser.orgID));

  const promises = fakeJobs.map((job) => dbInsertJob(job));

  jobIds = await Promise.all(promises).then((res) =>
    res.map(({job_id}) => job_id),
  );
});

afterAll(async () => {
  await truncateAllTables();
  jest.resetAllMocks();
  endConnection();
});

describe('applicants', () => {
  describe('GET /applicants', () => {
    let applicants: TApplicant[];
    beforeAll(async () => {
      const applicantsCount = random.number({min: 50, max: 100});
      const fakeApplicants = Array(applicantsCount)
        .fill(0)
        .map(() => fake.applicant(mockUser.orgID, randomElement(jobIds)));
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

    it('Isloates organization applicants', async () => {
      const fakeOrg = fake.organization(random.uuid());
      const {organization_id} = await dbInsertOrganization(fakeOrg);

      const fakeJob = fake.job(organization_id);
      const {job_id} = await dbInsertJob(fakeJob);

      const applicantsCount = random.number({min: 50, max: 100});
      const fakeApplicants = Array(applicantsCount)
        .fill(0)
        .map(() => fake.applicant(organization_id, job_id));
      const promises = fakeApplicants.map((appl) => dbInsertApplicant(appl));
      await Promise.all(promises);

      const res = await request(app)
        .get('/applicants')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.length).toBe(applicants.length);

      // applicant of different organiyation
      const foreignApplicant = res.body.find(
        (appl: TApplicant) => appl.organization_id !== mockUser.orgID,
      );

      expect(foreignApplicant).toBeUndefined();
    });

    it('Filters by job_id using query', async (done) => {
      const fakeOrg = fake.organization(random.uuid());
      const {organization_id} = await dbInsertOrganization(fakeOrg);

      const fakeJob = fake.job(organization_id);
      const {job_id} = await dbInsertJob(fakeJob);

      const applicantsCount = random.number({min: 50, max: 100});
      const fakeApplicants = Array(applicantsCount)
        .fill(0)
        .map(() => fake.applicant(organization_id, job_id));
      const promises = fakeApplicants.map((appl) => dbInsertApplicant(appl));
      await Promise.all(promises);

      const res = await request(app)
        .get('/applicants?job_id=' + job_id)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.length).toBe(0);

      done();
    });

    it('Isloates organization applicants with job_id query', async (done) => {
      const jobId = randomElement(jobIds);
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
      const fakeForm = fake.screeningForm(
        mockUser.orgID,
        randomElement(jobIds),
      );
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
            acc[item.form_item_id!] = random
              .number({min: 0, max: 5})
              .toString();
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
  describe('GET applicants/:applicant_id/report', () => {
    let applicant: TApplicant;
    beforeAll(async () => {
      applicant = await dbInsertApplicant(
        fake.applicant(mockUser.orgID, randomElement(jobIds)),
      );
    });
    it('returns 200 json response', (done) => {
      request(app)
        .get(
          `/applicants/${applicant.applicant_id}/report?form_category=screening`,
        )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('validates form_category query', (done) => {
      request(app)
        .get(`/applicants/${applicant.applicant_id}/report`)
        .set('Accept', 'application/json')
        .expect(422, done);
    });
  });
});
