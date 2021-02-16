import {v4 as uuidv4} from 'uuid';

type BaseJobRequirement = {requirementLabel: string; minValue?: string};
export type JobRequirement = {jobRequirementId: string} & BaseJobRequirement;

type BaseJob = {tenantId: string; jobTitle: string};
export type Job = {jobId: string; jobRequirements: JobRequirement[]} & BaseJob;

export const createJob = (
  job: BaseJob & {
    jobId?: string;
    jobRequirements: (BaseJobRequirement & {jobRequirementId?: string})[];
  },
): Job => {
  return Object.freeze({
    ...job,
    jobId: job.jobId || uuidv4(),
    jobRequirements: job.jobRequirements.map((requirement) => ({
      ...requirement,
      jobRequirementId: requirement.jobRequirementId || uuidv4(),
    })),
  });
};
