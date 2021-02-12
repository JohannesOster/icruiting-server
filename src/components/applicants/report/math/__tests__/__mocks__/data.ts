import {FormFieldIntent} from 'components/applicants/report/types';
import {EFormCategory} from 'db/repos/forms';
import {ReportPrepareRow} from 'db/repos/formSubmissions/types';

/**
 * NOTE: I did not find a better way to test the mathematical report building process.
 * The following code provides a data mock with a reasonable size, so that the solution
 * can be inferred (by manual calculations).
 *
 */

const submitterIds = ['jx3Rxd', 'g82zTb'];
const applicantIds = ['uhfzsE', 'v5eRBV'];
const jobRequirements = [
  {
    requirementLabel: 'Kreativität',
    jobRequirementId: 'KJ4kd4',
  },
  {
    requirementLabel: 'Empathie',
    jobRequirementId: 'r9TQtu',
  },
];

const forms = [
  {
    formId: 'fGp0zM',
    formCategory: 'assessment' as EFormCategory,
    formTitle: 'Einzelinterview',
    formFields: [
      {
        formFieldId: 'uFeGwm',
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 0,
        label: 'Der*die Bewerber*in ist kreativ',
        options: ['0', '1', '2', '3', '4'].map((s) => ({label: s, value: s})),
        ...jobRequirements[0],
      },
      {
        formFieldId: 'YMzJOz',
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 1,
        label: 'Der*die Bewerber*in bringt neue Ideen ein',
        options: ['0', '1', '2', '3', '4'].map((s) => ({label: s, value: s})),
        ...jobRequirements[1],
      },
      {
        formFieldId: 'KLeeEw',
        intent: 'aggregate' as FormFieldIntent,
        rowIndex: 2,
        label: 'Anmerkungen',
      },
    ],
  },
  {
    formId: 'JxcpXy',
    formCategory: 'assessment' as EFormCategory,
    formTitle: 'Gruppenübung',
    formFields: [
      {
        formFieldId: 'vDHnhB',
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 0,
        label: 'Der*die Bewerber*in ist kreativ',
        options: ['0', '1', '2', '3', '4'].map((s) => ({label: s, value: s})),
        ...jobRequirements[0],
      },
      {
        formFieldId: 'eU3ZML',
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 1,
        label: 'Der*die Bewerber*in versucht Kritik zu verstehen',
        options: ['0', '1', '2', '3', '4'].map((s) => ({label: s, value: s})),
        ...jobRequirements[0],
      },
      {
        formFieldId: 'h9PojA',
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 2,
        label: 'Der*die Bewerber*in bemüht sich die Ideen anderer aufzugreifen',
        options: ['0', '1', '2', '3', '4'].map((s) => ({label: s, value: s})),
        ...jobRequirements[1],
      },
    ],
  },
];

const submissions = [
  {
    submitterId: submitterIds[0],
    applicantId: applicantIds[0],
    formId: forms[0].formId,
    formCategory: forms[0].formCategory,
    formTitle: forms[0].formTitle,
  },
  {
    submitterId: submitterIds[0],
    applicantId: applicantIds[0],
    formId: forms[1].formId,
    formCategory: forms[1].formCategory,
    formTitle: forms[1].formTitle,
  },
  {
    submitterId: submitterIds[1],
    applicantId: applicantIds[0],
    formId: forms[0].formId,
    formCategory: forms[0].formCategory,
    formTitle: forms[0].formTitle,
  },
  {
    submitterId: submitterIds[1],
    applicantId: applicantIds[0],
    formId: forms[1].formId,
    formCategory: forms[1].formCategory,
    formTitle: forms[1].formTitle,
  },
  {
    submitterId: submitterIds[0],
    applicantId: applicantIds[1],
    formId: forms[0].formId,
    formCategory: forms[0].formCategory,
    formTitle: forms[0].formTitle,
  },
];

const data: ReportPrepareRow[] = [
  // submitter 1 - applicant 1 - form 1
  {...submissions[0], submissionValue: '4', ...forms[0].formFields[0]},
  {...submissions[0], submissionValue: '3', ...forms[0].formFields[1]},
  {...submissions[0], submissionValue: 'Anmerk. 1', ...forms[0].formFields[2]},
  // submitter 1 - applicant 1 - form 2
  {...submissions[1], submissionValue: '2', ...forms[1].formFields[0]},
  {...submissions[1], submissionValue: '3', ...forms[1].formFields[1]},
  {...submissions[1], submissionValue: '4', ...forms[1].formFields[2]},
  // submitter 2 - applicant 1 - form 1
  {...submissions[2], submissionValue: '2', ...forms[0].formFields[0]},
  {...submissions[2], submissionValue: '1', ...forms[0].formFields[1]},
  {...submissions[2], submissionValue: 'Anmerk. 2', ...forms[0].formFields[2]},
  // submitter 1 - applicant 1 - form 2
  {...submissions[3], submissionValue: '3', ...forms[1].formFields[0]},
  {...submissions[3], submissionValue: '3', ...forms[1].formFields[1]},
  {...submissions[3], submissionValue: '3', ...forms[1].formFields[2]},
  // submitter 1 - applicant 2 - form 1
  {...submissions[3], submissionValue: '4', ...forms[0].formFields[0]},
  {...submissions[3], submissionValue: '3', ...forms[0].formFields[1]},
  {...submissions[3], submissionValue: 'Anmerk. 3', ...forms[0].formFields[2]},
  // missing on purpose:
  // submitter 1 - applicant 2 - form 2
  // submitter 2 - applicant 2 - form 1 and 2
];

export default data;
