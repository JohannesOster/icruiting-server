import db from 'infrastructure/db';
import fake from './fake';
import {random} from 'faker';
import {FormCategory} from 'domain/entities';

const dataGenerator = {
  insertTenant: (tenantId: string = random.uuid()) => {
    const tenant = fake.tenant(tenantId);
    return db.tenants.create(tenant);
  },
  insertJob: (tenantId: string) => {
    const job = fake.job(tenantId);
    return db.jobs.create(job);
  },
  insertForm: (tenantId: string, jobId: string, formCategory: FormCategory) => {
    let form: any;
    if (formCategory === 'application') {
      form = fake.applicationForm(tenantId, jobId);
    } else if (formCategory === 'screening') {
      form = fake.screeningForm(tenantId, jobId);
    } else {
      form = fake.assessmentForm(tenantId, jobId);
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
