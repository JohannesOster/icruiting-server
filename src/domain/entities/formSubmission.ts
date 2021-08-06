import {v4 as uuid} from 'uuid';

type BaseFormSubmission = {
  tenantId: string;
  formId: string;
  submitterId: string;
  applicantId: string;
  submission: {[formFieldId: string]: string};
};

export type FormSubmission = {formSubmissionId: string} & BaseFormSubmission;

export const createFormSubmission = (
  formSubmission: BaseFormSubmission & {formSubmissionId?: string},
): FormSubmission => {
  return Object.freeze({
    ...formSubmission,
    formSubmissionId: formSubmission.formSubmissionId || uuid(),
  });
};
