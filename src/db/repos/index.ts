import {TenantsRepository} from './tenants';
import {JobssRepository} from './jobs';
import {ApplicantsRepository} from './applicants';

export interface IExtensions {
  tenants: ReturnType<typeof TenantsRepository>;
  jobs: ReturnType<typeof JobssRepository>;
  applicants: ReturnType<typeof ApplicantsRepository>;
}

export {TenantsRepository, JobssRepository, ApplicantsRepository};
