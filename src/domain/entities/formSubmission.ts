export type FormSubmission = {
  tenantId: string;
  formId: string;
  submitterId: string;
  applicantId: string;
  submission: {[formFieldId: string]: string};
};

export const createFormSubmission = (
  formSubmisson: FormSubmission,
): FormSubmission => {
  return Object.freeze(formSubmisson);
};
