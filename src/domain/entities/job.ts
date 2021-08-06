import {v4 as uuid} from 'uuid';

type BaseJobRequirement = {
  /** A human readable term for the requirement. */
  requirementLabel: string;
  /** The minimal value for this requirement (relevant for assessment evaluations) */
  minValue?: number;
};
export type JobRequirement = {
  /** A unique id */
  jobRequirementId: string;
  /** The unique id of the job the requirement belongs to */
  jobId: string;
} & BaseJobRequirement;

type BaseJob = {
  /** The unique id of the tenant the job belongs to */
  tenantId: string;
  /** A human readable term for the job */
  jobTitle: string;
};
export type Job = {
  /** A unique id */
  jobId: string;
  /** A list of requirements for the job */
  jobRequirements: JobRequirement[];
} & BaseJob;

export const createJob = (
  job: BaseJob & {
    jobId?: string;
    jobRequirements: (BaseJobRequirement & {jobRequirementId?: string})[];
  },
): Job => {
  const jobId = job.jobId || uuid();

  // Add appropriate jobId and assign uuid if it does not exist
  const jobRequirements = job.jobRequirements.map((requirement) => ({
    ...requirement,
    jobId,
    jobRequirementId: requirement.jobRequirementId || uuid(),
  }));

  return Object.freeze({...job, jobId, jobRequirements});
};
