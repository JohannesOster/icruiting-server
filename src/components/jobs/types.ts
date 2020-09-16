export type TJob = {
  job_title: string;
  tenant_id: string;
  job_requirements: Array<{
    requirement_label: string;
  }>;
};
