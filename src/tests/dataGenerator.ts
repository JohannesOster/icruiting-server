import {dbInsertTenant} from 'components/tenants';
import {dbInsertJob} from 'components/jobs';
import {dbInsertApplicant} from 'components/applicants';
import fake from './fake';
import {EFormCategory, TFormRequest, dbInsertForm} from 'components/forms';
import {dbInsertFormSubmission} from 'components/formSubmissions';

const dataGenerator = {
  insertTenant: (tenant_id: string) => {
    const tenant = fake.tenant(tenant_id);
    return dbInsertTenant(tenant);
  },
  insertJob: (tenant_id: string) => {
    const job = fake.job(tenant_id);
    return dbInsertJob(job);
  },
  insertForm: (
    tenant_id: string,
    job_id: string,
    form_category: EFormCategory,
  ) => {
    let form: TFormRequest;
    if (form_category === EFormCategory.application) {
      form = fake.applicationForm(tenant_id, job_id);
    } else if (form_category === EFormCategory.screening) {
      form = fake.screeningForm(tenant_id, job_id);
    } else {
      form = fake.assessmentForm(tenant_id, job_id);
    }

    return dbInsertForm(form);
  },
  insertApplicant: (
    tenant_id: string,
    job_id: string,
    form_field_ids: string[],
  ) => {
    const applicant = fake.applicant(tenant_id, job_id, form_field_ids);
    return dbInsertApplicant(applicant);
  },
  insertFormSubmission: (
    tenant_id: string,
    applicant_id: string,
    submitter_id: string,
    form_id: string,
    form_field_ids: string[],
  ) => {
    const formSubmission = fake.formSubmission(
      tenant_id,
      applicant_id,
      submitter_id,
      form_id,
      form_field_ids,
    );
    return dbInsertFormSubmission(formSubmission);
  },
};

export default dataGenerator;
