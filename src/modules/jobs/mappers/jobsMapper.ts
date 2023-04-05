import {createJob, Job} from '../domain';
import {DBJob} from '../infrastructure/repositories/jobsRepository';
import jobRequirementsMapper from './jobRequirementsMapper';

const toPersistance = (tenantId: string, job: Job): DBJob => {
  const {id: jobId, jobRequirements: _jobRequirements, ..._job} = job;

  const jobRequirements = _jobRequirements.map((req) =>
    jobRequirementsMapper.toPersistance(jobId, req),
  );

  return Object.freeze({jobId, tenantId, jobRequirements, ..._job});
};

const toDomain = (raw: DBJob): Job => {
  const {jobId, jobRequirements: _jobRequirements = [], ..._job} = raw;
  const jobRequirements = _jobRequirements.map(jobRequirementsMapper.toDomain);
  return createJob({..._job, jobRequirements}, jobId);
};

const toDTO = (tenantId: string, job: Job) => {
  return toPersistance(tenantId, job);
};

export default {toPersistance, toDomain, toDTO};
