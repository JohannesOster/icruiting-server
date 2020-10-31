import {random} from 'faker';
import {flatten} from './utils';

const {uuid, word, words, number: randNumber} = random;

export const tenant = {tenant_id: uuid(), tenant_name: uuid()};

export const job = {
  tenant_id: tenant.tenant_id,
  job_id: uuid(),
  job_title: word(),
};

export const jobRequirements = [
  {
    job_requirement_id: uuid(),
    job_id: job.job_id,
    requirement_label: words(),
    min_value: randNumber(),
  },
  {
    job_requirement_id: uuid(),
    job_id: job.job_id,
    requirement_label: words(),
    min_value: randNumber(),
  },
];

export const screeningForm = {
  form_id: uuid(),
  tenant_id: tenant.tenant_id,
  job_id: job.job_id,
  form_category: 'screening',
};

export const screeningFormFields = [
  {
    form_field_id: uuid(),
    form_id: screeningForm.form_id,
    intent: 'sum_up',
    component: 'rating_group',
    row_index: 0,
    label: words(),
    description: words(),
    default_value: '0',
    options: JSON.stringify([
      {label: '0', value: '0'},
      {label: '1', value: '1'},
      {label: '2', value: '2'},
    ]),
    required: true,
  },
];

export const applicationForm = {
  form_id: uuid(),
  tenant_id: tenant.tenant_id,
  job_id: job.job_id,
  form_category: 'screening',
};

export const applicationFormFields = [
  {
    form_field_id: uuid(),
    form_id: applicationForm.form_id,
    component: 'input',
    row_index: 0,
    label: words(),
    description: words(),
    required: true,
  },
];

export const applicants = [
  {
    tenant_id: tenant.tenant_id,
    job_id: job.job_id,
    applicant_id: uuid(),
  },
];

export const applicantAttributes = flatten(
  applicants.map(({applicant_id}) =>
    applicationFormFields.map(({form_field_id}) => ({
      applicant_id,
      form_field_id,
      attribute_value: words(),
    })),
  ),
);
