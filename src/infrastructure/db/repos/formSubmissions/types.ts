import {FormFieldIntent} from 'adapters/applicants/report/types';
import {FormCategory} from 'domain/entities';

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
  jobRequirementId?: string;
};
