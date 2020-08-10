import db from '.';
import {
  selectScreeningRanking as selectScreeningRankingSQL,
  selectAssessmentRanking as selectAssessmentRankingSQL,
} from './sql';

export const selectScreeningRanking = (job_id: string) => {
  return db.any(selectScreeningRankingSQL, {job_id});
};

export const selectAssessmentRanking = (job_id: string) => {
  return db.any(selectAssessmentRankingSQL, {job_id});
};
