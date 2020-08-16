import db from 'db';
import {
  selectScreeningRanking as selectScreeningRankingSQL,
  selectAssessmentRanking as selectAssessmentRankingSQL,
} from './sql';

export const dbSelectScreeningRanking = (
  job_id: string,
  organization_id: string,
) => {
  return db.any(selectScreeningRankingSQL, {job_id, organization_id});
};

export const dbSelectAssessmentRanking = (
  job_id: string,
  organization_id: string,
) => {
  return db.any(selectAssessmentRankingSQL, {job_id, organization_id});
};
