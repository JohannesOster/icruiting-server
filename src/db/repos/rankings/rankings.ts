import {decamelizeKeys} from 'humps';
import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';

export const RankingsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const retrieve = (tenantId: string, jobId: string, formCategory: string) => {
    const params = {tenantId, jobId, formCategory};
    return db.any(sql.find, decamelizeKeys(params));
  };

  return {retrieve};
};
