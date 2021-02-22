import db from 'infrastructure/db';
import fake from './fake';
import {random} from 'faker';
import {Form, FormCategory} from 'domain/entities';

const dataGenerator = {
  insertTenant: (tenantId: string = random.uuid()) => {
    const tenant = fake.tenant(tenantId);
    return db.tenants.create(tenant);
  },
  insertJob: (tenantId: string) => {
    const job = fake.job(tenantId);
    return db.jobs.create(job);
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

    return db.forms.create(form);
  },
  insertApplicant: (
    tenantId: string,
    jobId: string,
    formFieldIds: string[],
  ) => {
    const applicant = fake.applicant(tenantId, jobId, formFieldIds);
    return db.applicants.create(applicant);
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
    return db.formSubmissions.create(formSubmission);
  },
};

export default dataGenerator;
