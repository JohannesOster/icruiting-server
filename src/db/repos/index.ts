import {TenantsRepository} from './tenants';
import {JobssRepository} from './jobs';
import {ApplicantsRepository} from './applicants';
import {FormsRepository} from './forms';
import {FormSubmissionsRepository} from './formSubmissions';

export interface IExtensions {
  tenants: ReturnType<typeof TenantsRepository>;
  jobs: ReturnType<typeof JobssRepository>;
  applicants: ReturnType<typeof ApplicantsRepository>;
  forms: ReturnType<typeof FormsRepository>;
  formSubmissions: ReturnType<typeof FormSubmissionsRepository>;
}

export {
  TenantsRepository,
  JobssRepository,
  ApplicantsRepository,
  FormsRepository,
  FormSubmissionsRepository,
};
