import db from 'db';
import {
  selectScreeningRanking as selectScreeningRankingSQL,
  selectAssessmentRanking as selectAssessmentRankingSQL,
} from './sql';

export const dbSelectScreeningRanking = (jobId: string, tenantId: string) => {
  return db.any(selectScreeningRankingSQL, {jobId, tenantId});
};

export const dbSelectAssessmentRanking = (jobId: string, tenantId: string) => {
  return db.any(selectAssessmentRankingSQL, {jobId, tenantId});
};
