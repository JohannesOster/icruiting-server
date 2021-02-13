import {catchAsync} from 'adapters/errorHandling';
import db from 'infrastructure/db';

export const retrieve = catchAsync(async (req, res) => {
  const jobId = req.params.jobId;
  const {tenantId} = req.user;
  const formCategory = req.query.formCategory as string;
  const data = await db.rankings.retrieve(tenantId, jobId, formCategory);
  res.status(200).json(data);
});
