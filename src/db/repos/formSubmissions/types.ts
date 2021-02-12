import {FormFieldIntent} from 'components/applicants/report/types';
import {EFormCategory} from '../forms';

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
  formCategory: EFormCategory;
  requirementLabel?: string;
  jobRequirementId?: string;
};
