import {
  FormFieldComponent,
  FormFieldIntent,
  FormFieldVisibility,
} from 'modules/forms/domain';
import {FormCategory} from 'modules/forms/domain/form';

export interface FormField {
  formId: string;
  formFieldId: string;
  rowIndex: number;
  component: FormFieldComponent; // TODO: quick fix to not have to convert every string attribute to specific type
  label: string;
  intent?: FormFieldIntent;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
  options?: {optionId: string; label: string; value: string}[];
  editable?: boolean;
  deletable?: boolean;
  jobRequirementId?: string;
  visibility: FormFieldVisibility;
}

export interface Form {
  tenantId: string;
  formId: string;
  jobId: string;
  formTitle?: string;
  formCategory: FormCategory;
  formFields: FormField[];
  replicaOf?: string;
}
