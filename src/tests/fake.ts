import faker from 'faker';
import {EFormCategory} from '../controllers/forms';

const fake = {
  user: (user_role: 'admin' | 'user' = 'admin') => ({
    orgID: faker.random.uuid(),
    sub: faker.random.uuid(),
    user_role: user_role,
  }),
  organization: (organization_id: string = '') => ({
    organization_id,
    organization_name: faker.company.companyName(),
  }),
  job: (organization_id: string) => ({
    organization_id,
    job_title: faker.company.companyName(),
    job_requirements: [
      {requirement_label: faker.commerce.productName()},
      {requirement_label: faker.commerce.productName()},
      {requirement_label: faker.commerce.productName()},
    ],
  }),
  applicant: (organization_id: string, job_id: string) => ({
    organization_id,
    job_id,
    attributes: JSON.stringify([
      {key: faker.random.alphaNumeric(), value: faker.random.alphaNumeric()},
      {key: faker.random.alphaNumeric(), value: faker.random.alphaNumeric()},
      {key: faker.random.alphaNumeric(), value: faker.random.alphaNumeric()},
    ]),
    files: JSON.stringify([
      {key: faker.random.alphaNumeric(), value: faker.image.imageUrl()},
      {key: faker.random.alphaNumeric(), value: faker.image.imageUrl()},
      {key: faker.random.alphaNumeric(), value: faker.image.imageUrl()},
    ]),
  }),
  applicationForm: (organization_id: string, job_id: string) => ({
    organization_id,
    job_id: job_id,
    form_category: EFormCategory.application,
    form_items: [
      {
        component: 'input',
        label: faker.random.word(),
        placeholder: faker.random.word(),
        row_index: 0,
        validation: {required: true},
      },
      {
        component: 'select',
        label: faker.random.word(),
        row_index: 1,
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
  screeningForm: (organization_id: string, job_id: string) => ({
    organization_id,
    job_id: job_id,
    form_category: EFormCategory.screening,
    form_items: [
      {
        component: 'rating_group',
        label: faker.random.word(),
        placeholder: faker.random.word(),
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
  assessmentForm: (organization_id: string, job_id: string) => ({
    organization_id,
    job_id: job_id,
    form_category: EFormCategory.assessment,
    form_items: [
      {
        component: 'rating_group',
        label: faker.random.word(),
        placeholder: faker.random.word(),
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
