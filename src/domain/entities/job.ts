import {v4 as uuidv4} from 'uuid';

type BaseJobRequirement = {requirementLabel: string; minValue?: number};
export type JobRequirement = {
  jobRequirementId: string;
  jobId: string;
} & BaseJobRequirement;

type BaseJob = {tenantId: string; jobTitle: string};
export type Job = {jobId: string; jobRequirements: JobRequirement[]} & BaseJob;

export const createJob = (
  job: BaseJob & {
    jobId?: string;
    jobRequirements: (BaseJobRequirement & {jobRequirementId?: string})[];
  },
): Job => {
  const jobId = job.jobId || uuidv4();
  return Object.freeze({
    ...job,
    jobId,
    jobRequirements: job.jobRequirements.map((requirement) => ({
      ...requirement,
      jobId,
      jobRequirementId: requirement.jobRequirementId || uuidv4(),
    })),
  });
};
