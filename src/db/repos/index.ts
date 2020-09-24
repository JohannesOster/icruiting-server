import {TenantsRepository} from './tenants';
import {JobssRepository} from './jobs';

export interface IExtensions {
  tenants: ReturnType<typeof TenantsRepository>;
  jobs: ReturnType<typeof JobssRepository>;
}

export {TenantsRepository, JobssRepository};
