import {DBAccess} from 'shared/infrastructure/http';
import {FormsRepository} from 'modules/forms/infrastructure/db/repositories';
import {FormSubmissionsRepository} from './formSubmissions';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {
    forms: FormsRepository(dbAccess),
    formSubmissions: FormSubmissionsRepository(dbAccess),
  };
};
