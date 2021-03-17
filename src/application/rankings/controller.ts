import db from 'infrastructure/db';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';

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
