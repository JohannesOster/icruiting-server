import {v4 as uuidv4} from 'uuid';

type BaseFormSubmission = {
  tenantId: string;
  formId: string;
  submitterId: string;
  applicantId: string;
  submission: {[formFieldId: string]: string};
};

export type FormSubmission = {formSubmissionId: string} & BaseFormSubmission;

export const createFormSubmission = (
  formSubmisson: BaseFormSubmission & {formSubmissionId?: string},
): FormSubmission => {
  return Object.freeze({
    ...formSubmisson,
    formSubmissionId: formSubmisson.formSubmissionId || uuidv4(),
  });
};