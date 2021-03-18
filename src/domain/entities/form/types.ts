export type FormFieldIntent = 'sum_up' | 'aggregate' | 'count_distinct';
export type FormFieldComponent =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file_upload'
  | 'rating_group'
  | 'section_header';

export type BaseFormField = {
  rowIndex: number;
  component: FormFieldComponent;
  label: string;
  intent?: FormFieldIntent;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
  options?: {label: string; value: string}[];
  editable?: boolean;
  deletable?: boolean;
  jobRequirementId?: string;
};

export type FormField = {formFieldId: string; formId: string} & BaseFormField;

export type FormCategory =
  | 'application'
  | 'screening'
  | 'assessment'
  | 'onboarding';

export type BaseForm = {
  tenantId: string;
  jobId: string;
  formCategory: FormCategory;
  formTitle?: string;
  replicaOf?: string;
};

export type Form = {formId: string; formFields: FormField[]} & BaseForm;
