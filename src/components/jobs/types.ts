export type TJob = {
  job_title: string;
  organization_id: string;
  job_requirements: Array<{
    requirement_label: string;
    icon?: string;
    minimal_score?: number;
  }>;
};
