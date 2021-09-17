import {DBAccess} from 'infrastructure/db';
import {TenantsRepository} from 'modules/tenants/infrastructure/repositories/tenantsRepository';
import {FormsRepository, ApplicantsRepository} from './repositories';

export interface DB extends ReturnType<typeof initializeDb> {}

export const initializeDb = (dbAccess: DBAccess) => {
  return {
    forms: FormsRepository(dbAccess),
    applicants: ApplicantsRepository(dbAccess),
    tenants: TenantsRepository(dbAccess),
  };
};
