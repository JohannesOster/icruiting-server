import {v4 as uuidv4} from 'uuid';

type BaseFormField = {
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
};

export type FormField = {
  formFieldId: string;
} & BaseFormField;

export type FormCategory = 'application' | 'screening' | 'assessment';
type BaseForm = {
  tenantId: string;
  jobId: string;
  formCategory: FormCategory;
  formTitle?: string;
};

export type Form = {
  formId: string;
  formFields: FormField[];
} & BaseForm;

export const createForm = (
  form: BaseForm & {formFields: BaseFormField[]},
): Form => {
  return Object.freeze({
    formId: uuidv4(),
    ...form,
    formFields: form.formFields.map((field) => ({
      formFieldId: uuidv4(),
      ...field,
    })),
  });
};
