import {httpReqHandler} from 'shared/infrastructure/http';
import {DB} from '../infrastructure/repositories';

export const RankingsAdapter = (db: DB) => {
  const retrieve = httpReqHandler(async (req) => {
    const jobId = req.params.jobId;
    const {tenantId} = req.user;
    const formCategory = req.query.formCategory as string;
    const data = await db.rankings.retrieve(tenantId, jobId, formCategory);
    return {body: data};
  });

  const retrieveTE = httpReqHandler(async (req) => {
    const jobId = req.params.jobId;
    const {formId} = req.query;
    const {tenantId} = req.user;
    const data = await db.rankings.retrieveTE(tenantId, jobId, formId);
    return {body: data};
  });

  return {retrieve, retrieveTE};
};
