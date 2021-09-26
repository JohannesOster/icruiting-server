import faker from 'faker';
import {createForm, createFormField} from 'modules/forms/domain';
import {formsMapper} from 'modules/forms/mappers';
import {createFormSubmission} from 'modules/formSubmissions/domain';
import {formSubmissionsMapper} from 'modules/formSubmissions/mappers';
import {createJob, createJobRequirement} from 'modules/jobs/domain';
import jobsMapper from 'modules/jobs/mappers/jobsMapper';
import {createTenant} from 'modules/tenants/domain';
import {tenantsMapper} from 'modules/tenants/mappers';

const fake = {
  user: (userRole: 'admin' | 'member' = 'admin') => ({
    tenantId: faker.random.uuid(),
    userId: faker.random.uuid(),
    email: faker.internet.email(),
    userRole,
  }),
  tenant: (tenantId?: string) => {
    const tenant = createTenant(
      {tenantName: faker.company.companyName()},
      tenantId,
    );
    return tenantsMapper.toPersistance(tenant);
  },
  job: (tenantId: string) => {
    const job = createJob({
      jobTitle: faker.company.companyName(),
      jobRequirements: [
        createJobRequirement({
          requirementLabel: faker.commerce.productName(),
          minValue: 3,
        }),
        createJobRequirement({requirementLabel: faker.commerce.productName()}),
        createJobRequirement({requirementLabel: faker.commerce.productName()}),
      ],
    });
    return jobsMapper.toDTO(tenantId, job);
  },
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
  applicationForm: (tenantId: string, jobId: string) => {
    const form = createForm({
      tenantId,
      jobId,
      formCategory: 'application',
      formFields: [
        createFormField({
          component: 'input',
          label: 'E-Mail-Adresse',
          placeholder: faker.random.word(),
          rowIndex: 0,
          required: true,
          description: faker.random.words(),
          visibility: 'all',
        }),
        createFormField({
          component: 'input',
          label: 'Vollständiger Name',
          placeholder: faker.random.word(),
          rowIndex: 1,
          required: true,
          description: faker.random.words(),
          visibility: 'all',
        }),
        createFormField({
          component: 'checkbox',
          rowIndex: 2,
          label: faker.random.word(),
          description: faker.random.words(),
          options: [
            {
              id: faker.random.uuid(),
              label: faker.random.word(),
              value: faker.random.alphaNumeric(),
            },
            {
              id: faker.random.uuid(),
              label: faker.random.word(),
              value: faker.random.alphaNumeric(),
            },
            {
              id: faker.random.uuid(),
              label: faker.random.word(),
              value: faker.random.alphaNumeric(),
            },
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        }),
        createFormField({
          component: 'file_upload',
          label: faker.random.word(),
          rowIndex: 3,
          description: faker.random.words(),
          editable: true,
          deletable: true,
          visibility: 'all',
        }),
      ],
    });

    return formsMapper.toDTO(form);
  },
  screeningForm: (tenantId: string, jobId: string) => {
    const form = createForm({
      tenantId,
      jobId,
      formCategory: 'screening',
      formFields: [
        createFormField({
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          description: faker.random.words(),
          intent: 'sum_up',
          rowIndex: 0,
          defaultValue: '1',
          options: [
            {id: faker.random.uuid(), label: '1', value: '1'},
            {id: faker.random.uuid(), label: '2', value: '2'},
            {id: faker.random.uuid(), label: '3', value: '3'},
            {id: faker.random.uuid(), label: '4', value: '4'},
            {id: faker.random.uuid(), label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        }),
        createFormField({
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          description: faker.random.words(),
          intent: 'sum_up',
          rowIndex: 1,
          defaultValue: '1',
          options: [
            {id: faker.random.uuid(), label: '1', value: '1'},
            {id: faker.random.uuid(), label: '2', value: '2'},
            {id: faker.random.uuid(), label: '3', value: '3'},
            {id: faker.random.uuid(), label: '4', value: '4'},
            {id: faker.random.uuid(), label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        }),
      ],
    });
    return formsMapper.toDTO(form);
  },
  assessmentForm: (tenantId: string, jobId: string) => {
    const form = createForm({
      tenantId,
      jobId,
      formCategory: 'assessment',
      formTitle: faker.random.words(),
      formFields: [
        createFormField({
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          intent: 'sum_up',
          rowIndex: 0,
          defaultValue: '1',
          options: [
            {id: faker.random.uuid(), label: '1', value: '1'},
            {id: faker.random.uuid(), label: '2', value: '2'},
            {id: faker.random.uuid(), label: '3', value: '3'},
            {id: faker.random.uuid(), label: '4', value: '4'},
            {id: faker.random.uuid(), label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        }),
        createFormField({
          component: 'rating_group',
          label: faker.random.word(),
          placeholder: faker.random.word(),
          intent: 'sum_up',
          rowIndex: 1,
          defaultValue: '1',
          options: [
            {id: faker.random.uuid(), label: '1', value: '1'},
            {id: faker.random.uuid(), label: '2', value: '2'},
            {id: faker.random.uuid(), label: '3', value: '3'},
            {id: faker.random.uuid(), label: '4', value: '4'},
            {id: faker.random.uuid(), label: '5', value: '5'},
          ],
          editable: true,
          deletable: true,
          visibility: 'all',
        }),
      ],
    });
    return formsMapper.toDTO(form);
  },
  onboardingForm: (tenantId: string, jobId: string, replicaOf?: string) => {
    const form = createForm({
      tenantId,
      jobId,
      formCategory: 'onboarding',
      formTitle: faker.random.words(),
      replicaOf,
      ...(replicaOf
        ? {formFields: []}
        : {
            formFields: [
              createFormField({
                component: 'rating_group',
                label: faker.random.word(),
                placeholder: faker.random.word(),
                intent: 'sum_up',
                rowIndex: 0,
                defaultValue: '1',
                options: [
                  {id: faker.random.uuid(), label: '1', value: '1'},
                  {id: faker.random.uuid(), label: '2', value: '2'},
                  {id: faker.random.uuid(), label: '3', value: '3'},
                  {id: faker.random.uuid(), label: '4', value: '4'},
                  {id: faker.random.uuid(), label: '5', value: '5'},
                ],
                editable: true,
                deletable: true,
                visibility: 'all',
              }),
              createFormField({
                component: 'rating_group',
                label: faker.random.word(),
                placeholder: faker.random.word(),
                intent: 'sum_up',
                rowIndex: 1,
                defaultValue: '1',
                options: [
                  {id: faker.random.uuid(), label: '1', value: '1'},
                  {id: faker.random.uuid(), label: '2', value: '2'},
                  {id: faker.random.uuid(), label: '3', value: '3'},
                  {id: faker.random.uuid(), label: '4', value: '4'},
                  {id: faker.random.uuid(), label: '5', value: '5'},
                ],
                editable: true,
                deletable: true,
                visibility: 'all',
              }),
            ],
          }),
    });
    return formsMapper.toDTO(form);
  },
  formSubmission: (
    tenantId: string,
    applicantId: string,
    submitterId: string,
    formId: string,
    formFieldIds: string[],
  ) => {
    const formSubmission = createFormSubmission({
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
    });

    return formSubmissionsMapper.toDTO(tenantId, formSubmission);
  },
};

export default fake;
