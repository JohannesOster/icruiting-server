import {FormSubmissionsRepository} from 'modules/formSubmissions/infrastructure/repositories/formSubmissions';
import {DBAccess} from 'shared/infrastructure/http';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {formSubmissions: FormSubmissionsRepository(dbAccess)};
};
