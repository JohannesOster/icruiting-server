import {decamelizeKeys} from 'humps';
import {DBAccess} from 'shared/infrastructure/http';
import sql from './sql';

export const RankingsRepository = ({db}: DBAccess) => {
  const retrieve = (tenantId: string, jobId: string, formCategory: string) => {
    const params = {tenantId, jobId, formCategory};
    return db.any(sql.retrieve, decamelizeKeys(params));
  };

  return {retrieve};
};
