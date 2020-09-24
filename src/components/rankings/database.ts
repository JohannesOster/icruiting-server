import db from 'database';
import {
  selectScreeningRanking as selectScreeningRankingSQL,
  selectAssessmentRanking as selectAssessmentRankingSQL,
} from './sql';

export const dbSelectScreeningRanking = (job_id: string, tenant_id: string) => {
  return db.any(selectScreeningRankingSQL, {job_id, tenant_id});
};

export const dbSelectAssessmentRanking = (
  job_id: string,
  tenant_id: string,
) => {
  return db.any(selectAssessmentRankingSQL, {job_id, tenant_id});
};
