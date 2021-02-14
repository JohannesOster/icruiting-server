import {v4 as uuidv4} from 'uuid';

type BaseJobRequirement = {
  requirementLabel: string;
  minValue?: string;
};
export type JobRequirement = {
  jobRequirementId: string;
} & BaseJobRequirement;

type BaseJob = {
  tenantId: string;
  jobTitle: string;
};

export type Job = {
  jobId: string;
  jobRequirements: JobRequirement[];
} & BaseJob;

export const createJob = (
  job: BaseJob & {jobRequirements: BaseJobRequirement[]},
): Job => {
  return Object.freeze({
    jobId: uuidv4(),
    ...job,
    jobRequirements: job.jobRequirements.map((requirement) => ({
      jobRequirementId: uuidv4(),
      ...requirement,
    })),
  });
};
