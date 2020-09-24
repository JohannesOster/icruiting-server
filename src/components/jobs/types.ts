export type TJob = {
  jobId?: string;
  jobTitle: string;
  tenantId: string;
  jobRequirements: Array<{
    requirementLabel: string;
  }>;
};
