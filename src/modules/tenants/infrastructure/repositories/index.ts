import {DBAccess} from 'shared/infrastructure';
import {TenantsRepository} from './tenantsRepository';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {tenants: TenantsRepository(dbAccess)};
};
