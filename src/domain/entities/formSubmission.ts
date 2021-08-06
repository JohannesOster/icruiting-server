import {v4 as uuid} from 'uuid';

type BaseFormSubmission = {
  /** The unique id of the tenant the formSubission belongs to */
  tenantId: string;
  /** The unique id of the form the formSubmission belongs to */
  formId: string;
  /** The unique id of the user the formSubmission was created by */
  submitterId: string;
  /** The unique id of the applicant the formSubmission refers to */
  applicantId: string;
  /** The submission values as key-value pairs
   * key: The unique id of the formField the value was submitted with
   * value: The submission value
   */
  submission: {[formFieldId: string]: string};
};

export type FormSubmission = {
  /** A unique id */
  formSubmissionId: string;
} & BaseFormSubmission;

export const createFormSubmission = (
  formSubmission: BaseFormSubmission & {formSubmissionId?: string},
): FormSubmission => {
  const formSubmissionId = formSubmission.formSubmissionId || uuid();
  return Object.freeze({...formSubmission, formSubmissionId});
};
