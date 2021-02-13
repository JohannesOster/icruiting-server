import {TenantsRepository} from './tenants';
import {JobssRepository} from './jobs';
import {ApplicantsRepository} from './applicants';
import {FormsRepository} from './forms';
import {FormSubmissionsRepository} from './formSubmissions';
import {RankingsRepository} from './rankings';

export interface IExtensions {
  tenants: ReturnType<typeof TenantsRepository>;
  jobs: ReturnType<typeof JobssRepository>;
  applicants: ReturnType<typeof ApplicantsRepository>;
  forms: ReturnType<typeof FormsRepository>;
  formSubmissions: ReturnType<typeof FormSubmissionsRepository>;
  rankings: ReturnType<typeof RankingsRepository>;
}

export {
  TenantsRepository,
  JobssRepository,
  ApplicantsRepository,
  FormsRepository,
  FormSubmissionsRepository,
  RankingsRepository,
};
