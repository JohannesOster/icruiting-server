export enum EFormCategory {
  application = 'application',
  screening = 'screening',
  assessment = 'assessment',
}

export type TForm = {
  form_id?: string;
  organization_id: string;
  form_category: EFormCategory;
  form_title?: string;
  job_id: string;
  form_items: Array<{
    form_item_id?: string;
    form_id?: string;
    row_index: number;
    component: string;
    label: string;
    placeholder?: string;
    default_value?: string;
    validation?: {required: boolean};
    options?: Array<{label: string; value: string}>;
    editable?: boolean;
    deletable?: boolean;
    job_requirement_Id?: string;
  }>;
};
