import {decamelizeKeys} from 'humps';
import {DBAccess} from 'shared/infrastructure/http';
import sql from './sql';

export const RankingsRepository = ({db}: DBAccess) => {
  const retrieve = (tenantId: string, jobId: string, formCategory: string) => {
    const params = {tenantId, jobId, formCategory};
    return db.any(sql.retrieve, decamelizeKeys(params));
  };

  const retrieveTE = (tenantId: string, jobId: string, formId: string) => {
    const params = {tenantId, jobId, formId};
    return db.any(sql.retrieveTE, decamelizeKeys(params));
  };

  return {retrieve, retrieveTE};
};
