export type EFormCategory = 'application' | 'screening' | 'assessment';

export type Form = {
  tenantId: string;
  formId: string;
  formCategory: EFormCategory;
  formTitle?: string;
  jobId: string;
  formFields: {
    formId: string;
    formFieldId: string;
    rowIndex: number;
    component: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
    options?: {label: string; value: string}[];
    editable?: boolean;
    deletable?: boolean;
    jobRequirementId?: string;
  }[];
};
