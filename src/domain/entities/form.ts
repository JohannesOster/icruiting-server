import {v4 as uuidv4} from 'uuid';

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
type BaseFormField = {
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

export type FormField = {formFieldId: string} & BaseFormField;

export type FormCategory =
  | 'application'
  | 'screening'
  | 'assessment'
  | 'onboarding';
type BaseForm = {
  tenantId: string;
  jobId: string;
  formCategory: FormCategory;
  formTitle?: string;
};

export type Form = {formId: string; formFields: FormField[]} & BaseForm;

export const createForm = (
  form: BaseForm & {
    formId?: string;
    formFields: (BaseFormField & {formFieldId?: string})[];
  },
): Form => {
  return Object.freeze({
    ...form,
    formId: form.formId || uuidv4(),
    formFields: form.formFields.map((field) => ({
      ...field,
      formFieldId: field.formFieldId || uuidv4(),
    })),
  });
};
