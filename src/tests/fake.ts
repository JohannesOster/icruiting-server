import faker from 'faker';

const fake = {
  organization: (organization_id: string = '') => ({
    organization_id,
    organization_name: faker.company.companyName(),
  }),
  job: (organization_id: string = '') => ({
    organization_id,
    job_title: faker.company.companyName(),
    requirements: [
      {requirement_label: faker.commerce.productName()},
      {requirement_label: faker.commerce.productName()},
      {requirement_label: faker.commerce.productName()},
    ],
  }),
  applicationForm: (job_id: string, organization_id: string = '') => ({
    organization_id,
    job_id: job_id,
    form_title: faker.random.words(),
    form_category: 'APPLICATION',
    form_items: [
      {
        component: 'Input',
        label: faker.random.word(),
        placeholder: faker.random.word(),
        form_index: 0,
        validation: {required: true},
      },
      {
        component: 'Select',
        label: faker.random.word(),
        form_index: 1,
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
  screeningForm: (job_id: string, organization_id: string = '') => ({
    organization_id,
    job_id: job_id,
    form_title: faker.random.words(),
    form_category: 'SCREENING',
    form_items: [
      {
        component: 'RatingGroup',
        label: faker.random.word(),
        placeholder: faker.random.word(),
        form_index: 0,
        default_value: 1,
        options: [
          {label: '1', value: 1},
          {label: '2', value: 2},
          {label: '3', value: 3},
          {label: '4', value: 4},
          {label: '5', value: 5},
        ],
        editable: true,
        deletable: true,
      },
    ],
  }),
};

export default fake;
