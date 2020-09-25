import {TenantsRepository} from './tenants';
import {JobssRepository} from './jobs';
import {ApplicantsRepository} from './applicants';
import {FormsRepository} from './forms';

export interface IExtensions {
  tenants: ReturnType<typeof TenantsRepository>;
  jobs: ReturnType<typeof JobssRepository>;
  applicants: ReturnType<typeof ApplicantsRepository>;
  forms: ReturnType<typeof FormsRepository>;
}

export {
  TenantsRepository,
  JobssRepository,
  ApplicantsRepository,
  FormsRepository,
};
