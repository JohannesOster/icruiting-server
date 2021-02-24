import {FormCategory, FormFieldIntent} from 'domain/entities';

export type ReportPrepareRow = {
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
};
