import {
  createForm,
  createFormSubmission,
  createJob,
  createTenant,
} from 'domain/entities';
import faker from 'faker';

const fake = {
  user: (userRole: 'admin' | 'member' = 'admin') => ({
    tenantId: faker.random.uuid(),
    userId: faker.random.uuid(),
    email: faker.internet.email(),
    userRole,
  }),
  tenant: (tenantId?: string) =>
    createTenant({
      tenantId,
      tenantName: faker.company.companyName(),
    }),
  job: (tenantId: string) =>
    createJob({
      tenantId,
      jobTitle: faker.company.companyName(),
      jobRequirements: [
        {requirementLabel: faker.commerce.productName(), minValue: 3},
        {requirementLabel: faker.commerce.productName()},
        {requirementLabel: faker.commerce.productName()},
      ],
    }),
  applicant: (
    tenantId: string,
    jobId: string,
    formFieldIds: string[] = [],
  ) => ({
    tenantId,
    jobId,
    attributes: formFieldIds.map((formFieldId) => ({
      formFieldId,
      attributeValue: faker.random.words(),
    })),
  }),
  applicationForm: (tenantId: string, jobId: string) =>
    createForm({
      tenantId,
      jobId,
      formCategory: 'application',
      formFields: [
        {
          component: 'input',
          label: 'E-Mail-Adresse',
          placeholder: faker.random.word(),
          rowIndex: 0,
          required: true,
          description: faker.random.words(),
          visibility: 'all',
        },
        {
          component: 'input',
          label: 'Vollständiger Name',
          placeholder: faker.random.word(),
          rowIndex: 1,
          required: true,
          description: faker.random.words(),
          visibility: 'all',
        },
        {
          component: 'checkbox',
          rowIndex: 2,
          label: faker.random.word(),
          description: faker.random.words(),
          options: [
            {label: faker.random.word(), value: faker.random.alphaNumeric()},
            {label: faker.random.word(), value: faker.random.alphaNumeric()},
            {label: faker.random.word(), value: faker.random.alphaNumeric()},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        },
        {
          component: 'file_upload',
          label: faker.random.word(),
          rowIndex: 3,
          description: faker.random.words(),
          editable: true,
          deletable: true,
          visibility: 'all',
        },
      ],
    }),
  screeningForm: (tenantId: string, jobId: string) =>
    createForm({
      tenantId,
      jobId,
      formCategory: 'screening',
      formFields: [
        {
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          description: faker.random.words(),
          intent: 'sum_up',
          rowIndex: 0,
          defaultValue: '1',
          options: [
            {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'},
            {label: '4', value: '4'},
            {label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        },
        {
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          description: faker.random.words(),
          intent: 'sum_up',
          rowIndex: 1,
          defaultValue: '1',
          options: [
            {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'},
            {label: '4', value: '4'},
            {label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        },
      ],
    }),
  assessmentForm: (tenantId: string, jobId: string) =>
    createForm({
      tenantId,
      jobId,
      formCategory: 'assessment',
      formTitle: faker.random.words(),
      formFields: [
        {
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          intent: 'sum_up',
          rowIndex: 0,
          defaultValue: '1',
          options: [
            {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'},
            {label: '4', value: '4'},
            {label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        },
        {
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          intent: 'sum_up',
          rowIndex: 1,
          defaultValue: '1',
          options: [
            {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'},
            {label: '4', value: '4'},
            {label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        },
      ],
    }),
  onboardingForm: (tenantId: string, jobId: string, replicaOf?: string) =>
    createForm({
      tenantId,
      jobId,
      formCategory: 'onboarding',
      formTitle: faker.random.words(),
      replicaOf,
      ...(replicaOf
        ? {formFields: []}
        : {
            formFields: [
              {
                component: 'rating_group',
                label: faker.random.word(),
                placeholder: faker.random.word(),
                intent: 'sum_up',
                rowIndex: 0,
                defaultValue: '1',
                options: [
                  {label: '1', value: '1'},
                  {label: '2', value: '2'},
                  {label: '3', value: '3'},
                  {label: '4', value: '4'},
                  {label: '5', value: '5'},
                ],
                editable: true,
                deletable: true,
                visibility: 'all',
              },
              {
                component: 'rating_group',
                label: faker.random.word(),
                placeholder: faker.random.word(),
                intent: 'sum_up',
                rowIndex: 1,
                defaultValue: '1',
                options: [
                  {label: '1', value: '1'},
                  {label: '2', value: '2'},
                  {label: '3', value: '3'},
                  {label: '4', value: '4'},
                  {label: '5', value: '5'},
                ],
                editable: true,
                deletable: true,
                visibility: 'all',
              },
            ],
          }),
    }),
  formSubmission: (
    tenantId: string,
    applicantId: string,
    submitterId: string,
    formId: string,
    formFieldIds: string[],
  ) =>
    createFormSubmission({
      tenantId,
      applicantId,
      submitterId,
      formId,
      submission: formFieldIds.reduce(
        (acc: {[formFieldId: string]: string}, curr) => {
          acc[curr] = faker.random.number({min: 0, max: 5}).toString();
          return acc;
        },
        {},
      ),
    }),
};

export default fake;
