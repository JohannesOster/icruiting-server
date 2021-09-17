import {DBAccess} from 'infrastructure/db';
import {ApplicantsRepository} from 'infrastructure/db/repos';
import {FormsRepository} from 'modules/forms/infrastructure/db/repositories';
import {JobssRepository} from './jobsRepository';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {
    jobs: JobssRepository(dbAccess),
    applicants: ApplicantsRepository(dbAccess.db, dbAccess.pgp),
    forms: FormsRepository(dbAccess),
  };
};
