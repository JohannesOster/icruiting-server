import db from '.';
import {
  selectScreeningRanking as selectScreeningRankingSQL,
  selectAssessmentRanking as selectAssessmentRankingSQL,
} from './sql';

export const selectScreeningRanking = (
  job_id: string,
  organization_id: string,
) => {
  return db.any(selectScreeningRankingSQL, {job_id, organization_id});
};

export const selectAssessmentRanking = (
  job_id: string,
  organization_id: string,
) => {
  return db.any(selectAssessmentRankingSQL, {job_id, organization_id});
};
