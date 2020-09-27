import {IDatabase, IMain} from 'pg-promise';
import {buildReport} from '../utils';
import sql from './sql';

export const RankingsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const find = (tenantId: string, jobId: string, formCategory: string) => {
    return db
      .any(sql.find, {
        tenant_id: tenantId,
        job_id: jobId,
        form_category: formCategory,
      })
      .then((ranking) => ranking.map(buildReport));
  };

  return {find};
};
