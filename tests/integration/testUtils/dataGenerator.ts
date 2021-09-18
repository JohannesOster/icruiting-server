import db, {pgp} from 'infrastructure/db';
import fake from './fake';
import {random} from 'faker';
import {JobsRepository} from 'modules/jobs/infrastructure/repositories/jobsRepository';
import {FormsRepository} from 'modules/forms/infrastructure/db/repositories';
import {FormSubmissionsRepository} from 'modules/formSubmissions/infrastructure/repositories/formSubmissions';
import {TenantsRepository} from 'modules/tenants/infrastructure/repositories/tenantsRepository';
import {ApplicantsRepository} from 'modules/applicants/infrastructure/repositories/applicantsRepository';
import {FormCategory} from 'modules/forms/domain';
import {Form} from 'modules/forms/infrastructure/db/repositories/forms';

const tenantsRepo = TenantsRepository({db, pgp});
const jobsRepo = JobsRepository({db, pgp});
const formsRepo = FormsRepository({db, pgp});
const formSubmissionsRepo = FormSubmissionsRepository({db, pgp});
const applicantsRepo = ApplicantsRepository({db, pgp});

const dataGenerator = {
  insertTenant: (tenantId: string = random.uuid()) => {
    const tenant = fake.tenant(tenantId);
    return tenantsRepo.create(tenant);
  },
  insertJob: (tenantId: string) => {
    const job = fake.job(tenantId);
    return jobsRepo.create(job);
  },
  insertForm: (
    tenantId: string,
    jobId: string,
    formCategory: FormCategory,
    options?: {[key: string]: any},
  ) => {
    let form: Form;
    switch (formCategory) {
      case 'application': {
        form = fake.applicationForm(tenantId, jobId);
        break;
      }
      case 'screening': {
        form = fake.screeningForm(tenantId, jobId);
        break;
      }
      case 'assessment': {
        form = fake.assessmentForm(tenantId, jobId);
        break;
      }
      case 'onboarding': {
        form = fake.onboardingForm(tenantId, jobId, options?.replicaOf);
        break;
      }
    }

    return formsRepo.create(form);
  },
  insertApplicant: (
    tenantId: string,
    jobId: string,
    formFieldIds: string[],
  ) => {
    const applicant = fake.applicant(tenantId, jobId, formFieldIds);
    return applicantsRepo.create(applicant);
  },
  insertFormSubmission: (
    tenantId: string,
    applicantId: string,
    submitterId: string,
    formId: string,
    formFieldIds: string[],
  ) => {
    const formSubmission = fake.formSubmission(
      tenantId,
      applicantId,
      submitterId,
      formId,
      formFieldIds,
    );
    return formSubmissionsRepo.create(formSubmission);
  },
};

export default dataGenerator;
