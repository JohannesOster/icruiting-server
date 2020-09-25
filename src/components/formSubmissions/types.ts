export type TFormSubmission = {
  formSubmissionId?: string;
  tenantId: string;
  applicantId: string;
  submitterId: string;
  formId: string;
  submission: {[formFieldId: string]: string};
};
