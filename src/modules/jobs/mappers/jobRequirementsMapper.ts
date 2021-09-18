import {createJobRequirement, JobRequirement} from '../domain';
import {DBJobRequirement} from '../infrastructure/repositories/jobsRepository';

const toPersistance = (
  jobId: string,
  jobRequirement: JobRequirement,
): DBJobRequirement => {
  const {id: jobRequirementId, ..._jobRequirement} = jobRequirement;
  return Object.freeze({jobId, jobRequirementId, ..._jobRequirement});
};

const toDomain = (raw: DBJobRequirement): JobRequirement => {
  const {jobRequirementId, ..._jobRequirement} = raw;
  return createJobRequirement(_jobRequirement, jobRequirementId);
};

const toDTO = (jobId: string, jobRequirement: JobRequirement) => {
  return toPersistance(jobId, jobRequirement);
};

export default {toPersistance, toDomain, toDTO};
