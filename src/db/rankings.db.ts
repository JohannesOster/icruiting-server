import db from '.';
import {selectScreeningRanking as selectScreeningRankingSQL} from './sql';

export const selectScreeningRanking = (job_id: string) => {
  return db.any(selectScreeningRankingSQL, {job_id});
};
