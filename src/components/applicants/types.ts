export type TApplicant = {
  applicant_id?: string;
  job_id: string;
  attributes: Array<{key: string; value: string}>;
  files?: Array<{key: string; value: string}>;
};
