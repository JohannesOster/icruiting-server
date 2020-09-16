import faker from 'faker';
import {EFormCategory} from 'components/forms';

const fake = {
  user: (userRole: 'admin' | 'user' = 'admin') => ({
    tenant_id: faker.random.uuid(),
    sub: faker.random.uuid(),
    userRole,
  }),
  tenant: (tenant_id?: string) => ({
    tenant_id,
    tenant_name: faker.company.companyName(),
  }),
  job: (tenant_id: string) => ({
    tenant_id,
    job_title: faker.company.companyName(),
    job_requirements: [
      {requirement_label: faker.commerce.productName()},
      {requirement_label: faker.commerce.productName()},
      {requirement_label: faker.commerce.productName()},
    ],
  }),
  applicant: (tenant_id: string, job_id: string) => ({
    tenant_id,
    job_id,
    attributes: [
      {key: faker.random.alphaNumeric(), value: faker.random.words()},
      {key: faker.random.alphaNumeric(), value: faker.random.words()},
      {key: faker.random.alphaNumeric(), value: faker.random.words()},
    ],
    files: [
      {key: faker.random.alphaNumeric(), value: faker.image.imageUrl()},
      {key: faker.random.alphaNumeric(), value: faker.image.imageUrl()},
      {key: faker.random.alphaNumeric(), value: faker.image.imageUrl()},
    ],
  }),
  applicationForm: (tenant_id: string, job_id: string) => ({
    tenant_id,
    job_id: job_id,
    form_category: EFormCategory.application,
    form_fields: [
      {
        component: 'input',
        label: faker.random.word(),
        placeholder: faker.random.word(),
        row_index: 0,
        required: true,
        description: faker.random.words(),
      },
      {
        component: 'checkbox',
        label: faker.random.word(),
        description: faker.random.words(),
        options: [
          {label: faker.random.word(), value: faker.random.alphaNumeric()},
          {label: faker.random.word(), value: faker.random.alphaNumeric()},
          {label: faker.random.word(), value: faker.random.alphaNumeric()},
        ],
        editable: true,
        deletable: true,
        row_index: 1,
      },
      {
        component: 'select',
        label: faker.random.word(),
        row_index: 2,
        description: faker.random.words(),
        options: [
          {label: faker.random.word(), value: faker.random.alphaNumeric()},
          {label: faker.random.word(), value: faker.random.alphaNumeric()},
          {label: faker.random.word(), value: faker.random.alphaNumeric()},
        ],
        editable: true,
        deletable: true,
      },
    ],
  }),
  screeningForm: (tenant_id: string, job_id: string) => ({
    tenant_id,
    job_id: job_id,
    form_category: EFormCategory.screening,
    form_fields: [
      {
        component: 'rating_group',
        label: faker.random.word(),
        placeholder: faker.random.word(),
        description: faker.random.words(),
        intent: 'sum_up',
        row_index: 0,
        default_value: '1',
        options: [
          {label: '1', value: '1'},
          {label: '2', value: '2'},
          {label: '3', value: '3'},
          {label: '4', value: '4'},
          {label: '5', value: '5'},
        ],
        editable: true,
        deletable: true,
      },
    ],
  }),
  assessmentForm: (tenant_id: string, job_id: string) => ({
    tenant_id,
    job_id: job_id,
    form_category: EFormCategory.assessment,
    form_title: faker.random.words(),
    form_fields: [
      {
        component: 'rating_group',
        label: faker.random.word(),
        placeholder: faker.random.word(),
        intent: 'sum_up',
        row_index: 0,
        default_value: '1',
        options: [
          {label: '1', value: '1'},
          {label: '2', value: '2'},
          {label: '3', value: '3'},
          {label: '4', value: '4'},
          {label: '5', value: '5'},
        ],
        editable: true,
        deletable: true,
      },
    ],
  }),
};

export default fake;
