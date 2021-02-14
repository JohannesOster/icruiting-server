import {httpReqHandler} from 'adapters/errorHandling';
import db from 'infrastructure/db';

export const RankingsAdapter = () => {
  const retrieve = httpReqHandler(async (req) => {
    const jobId = req.params.jobId;
    const {tenantId} = req.user;
    const formCategory = req.query.formCategory as string;
    const data = await db.rankings.retrieve(tenantId, jobId, formCategory);
    return {body: data};
  });

  return {retrieve};
};
