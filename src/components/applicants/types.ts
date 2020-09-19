export type TApplicant = {
  applicant_id?: string;
  job_id: string;
  tenant_id: string;
  attributes: Array<{key: string; value: string}>;
  files?: Array<{key: string; value: string}>;
};

export type TApplicantDb = {
  applicant_id?: string;
  job_id: string;
  tenant_id: string;
  attributes: Array<{form_field_id: string; attribute_value: string}>;
};
