export enum EFormCategory {
  application = 'application',
  screening = 'screening',
  assessment = 'assessment',
}

type TFormFieldRequest = {
  rowIndex: number;
  component: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  options?: Array<{label: string; value: string}>;
  editable?: boolean;
  deletable?: boolean;
  jobRequirementId?: string;
};

type TFormField = {
  formId: string;
  formFieldId: string;
} & TFormFieldRequest;

type TFormBase = {
  tenantId: string;
  formCategory: EFormCategory;
  formTitle?: string;
  jobId: string;
};

export type TFormRequest = {
  formFields: TFormFieldRequest[];
} & TFormBase;

export type TForm = {
  formId: string;
  formFields: TFormField[];
} & TFormBase;
