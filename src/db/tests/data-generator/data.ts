import {random} from 'faker';
import fs from 'fs';

const {uuid, word, words, number: randNumber} = random;

const tenant = {tenant_id: uuid(), tenant_name: uuid()};

const job = {tenant_id: tenant.tenant_id, job_id: uuid(), job_title: word()};
const jobRequirements = [
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

const screeningForm = {
  form_id: uuid(),
  tenant_id: tenant.tenant_id,
  job_id: job.job_id,
  form_category: 'screening',
};

const screeningFormFields = [
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

export {tenant, job, jobRequirements, screeningForm, screeningFormFields};
