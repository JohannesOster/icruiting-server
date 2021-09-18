import {FormCategory, FormFieldIntent} from 'modules/forms/domain';

export interface FormSubmission {
  tenantId: string;
  formSubmissionId: string;
  formId: string;
  submitterId: string;
  applicantId: string;
  submission: {[formFieldId: string]: string};
}

export interface ReportPrepareRow {
  submissionValue: string;
  formFieldId: string;
  applicantId: string;
  submitterId: string;
  intent: FormFieldIntent;
  rowIndex: number;
  label: string;
  options?: {label: string; value: string}[];
  formId: string;
  formTitle: string;
  formCategory: FormCategory;
  replicaOf?: string;
  jobRequirementId?: string;
}
