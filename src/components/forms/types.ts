export enum EFormCategory {
  application = 'application',
  screening = 'screening',
  assessment = 'assessment',
}

type TFormFieldRequest = {
  row_index: number;
  component: string;
  label: string;
  placeholder?: string;
  default_value?: string;
  required?: boolean;
  options?: Array<{label: string; value: string}>;
  editable?: boolean;
  deletable?: boolean;
  job_requirement_Id?: string;
};

type TFormField = {
  form_id: string;
  form_field_id: string;
} & TFormFieldRequest;

type TFormBase = {
  tenant_id: string;
  form_category: EFormCategory;
  form_title?: string;
  job_id: string;
};

export type TFormRequest = {
  form_fields: TFormFieldRequest[];
} & TFormBase;

export type TForm = {
  form_id: string;
  form_fields: TFormField[];
} & TFormBase;
