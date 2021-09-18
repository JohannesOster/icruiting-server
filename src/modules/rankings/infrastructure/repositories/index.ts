import {DBAccess} from 'shared/infrastructure';
import {RankingsRepository} from './rankingsRepository';

export interface DB extends ReturnType<typeof initializeRepositories> {}

export const initializeRepositories = (dbAccess: DBAccess) => {
  return {rankings: RankingsRepository(dbAccess)};
};
