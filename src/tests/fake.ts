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
        item_validation: {required: true},
      },
      {
        component: 'Select',
        label: faker.random.word(),
        form_index: 1,
        item_options: [
          {label: faker.random.word(), name: faker.random.alphaNumeric()},
          {label: faker.random.word(), name: faker.random.alphaNumeric()},
          {label: faker.random.word(), name: faker.random.alphaNumeric()},
        ],
        editable: true,
        deletable: true,
      },
    ],
  }),
};

export default fake;
