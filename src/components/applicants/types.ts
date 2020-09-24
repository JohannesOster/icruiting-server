export type TApplicant = {
  applicantId?: string;
  jobId: string;
  tenantId: string;
  attributes: Array<{key: string; value: string}>;
  files?: Array<{key: string; value: string}>;
};

export type TApplicantDb = {
  applicantId?: string;
  jobId: string;
  tenantId: string;
  attributes: Array<{formFieldId: string; attributeValue: string}>;
};

export type TReport = {
  tenantId: string;
  jobId: string;
  attributes: {label: string; formItemId: string}[];
  image?: {label: string; formItemId: string};
};
