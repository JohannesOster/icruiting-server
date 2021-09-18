import {JobRequirement} from '.';
import {createEntity, Entity, EntityFactory} from 'shared/domain';

interface BaseJob {
  /** A human readable term for the job */
  jobTitle: string;
  /** A list of requirements for the job */
  jobRequirements: JobRequirement[];
}

export interface Job extends BaseJob, Entity {}

export const createJob: EntityFactory<BaseJob, Job> = (params, id): Job => {
  const {jobTitle, jobRequirements} = params;
  const job: BaseJob = {jobTitle, jobRequirements};
  return createEntity(job, id);
};
