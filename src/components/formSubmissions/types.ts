export type TFormSubmission = {
  form_submission_id?: string;
  tenant_id: string;
  applicant_id: string;
  submitter_id: string;
  form_id: string;
  submission: {[form_field_id: string]: string};
};
