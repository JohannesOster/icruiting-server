export type TFormSubmission = {
  applicant_id: string;
  submitter_id: string;
  form_id: string;
  submission: {[form_item_id: string]: string};
  comment: string;
};
