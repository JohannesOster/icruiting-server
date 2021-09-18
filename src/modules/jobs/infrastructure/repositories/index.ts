import {DBAccess} from 'infrastructure/db';
import {ApplicantsRepository} from 'modules/applicants/infrastructure/repositories/applicantsRepository';
import {FormsRepository} from 'modules/forms/infrastructure/db/repositories';
import {JobsRepository} from './jobsRepository';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {
    jobs: JobsRepository(dbAccess),
    applicants: ApplicantsRepository(dbAccess),
    forms: FormsRepository(dbAccess),
  };
};
