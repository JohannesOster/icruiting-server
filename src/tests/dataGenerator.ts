import db from 'db';
import fake from './fake';
import {random} from 'faker';
import {EFormCategory} from 'db/repos/forms';

const dataGenerator = {
  insertTenant: (tenantId: string = random.uuid()) => {
    const tenant = fake.tenant(tenantId);
    return db.tenants.insert(tenant);
  },
  insertJob: (tenantId: string) => {
    const job = fake.job(tenantId);
    return db.jobs.insert(job);
  },
  insertForm: (
    tenantId: string,
    jobId: string,
    formCategory: EFormCategory,
  ) => {
    let form: any;
    if (formCategory === 'application') {
      form = fake.applicationForm(tenantId, jobId);
    } else if (formCategory === 'screening') {
      form = fake.screeningForm(tenantId, jobId);
    } else {
      form = fake.assessmentForm(tenantId, jobId);
    }

    return db.forms.insert(form);
  },
  insertApplicant: (
    tenantId: string,
    jobId: string,
    formFieldIds: string[],
  ) => {
    const applicant = fake.applicant(tenantId, jobId, formFieldIds);
    return db.applicants.insert(applicant);
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
    return db.formSubmissions.insert(formSubmission);
  },
};

export default dataGenerator;
