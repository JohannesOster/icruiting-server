import {TenantsRepository} from './tenants';
import {JobsRepository} from './jobs';
import {ApplicantsRepository} from './applicants';
import {FormSubmissionsRepository} from './formSubmissions';
import {RankingsRepository} from './rankings';

export interface IExtensions {
  tenants: ReturnType<typeof TenantsRepository>;
  jobs: ReturnType<typeof JobsRepository>;
  applicants: ReturnType<typeof ApplicantsRepository>;
  formSubmissions: ReturnType<typeof FormSubmissionsRepository>;
  rankings: ReturnType<typeof RankingsRepository>;
}

export {
  TenantsRepository,
  JobsRepository,
  ApplicantsRepository,
  FormSubmissionsRepository,
  RankingsRepository,
};
