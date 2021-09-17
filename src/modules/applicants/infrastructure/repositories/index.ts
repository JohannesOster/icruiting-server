import {DBAccess} from 'infrastructure/db';
import {FormsRepository} from 'modules/forms/infrastructure/db/repositories';
import {FormSubmissionsRepository} from 'modules/formSubmissions/infrastructure/repositories/formSubmissions';
import {JobssRepository} from 'modules/jobs/infrastructure/repositories/jobsRepository';
import {ApplicantsRepository} from './applicantsRepository';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {
    applicants: ApplicantsRepository(dbAccess),
    forms: FormsRepository(dbAccess),
    jobs: JobssRepository(dbAccess),
    formSubmissions: FormSubmissionsRepository(dbAccess),
  };
};
