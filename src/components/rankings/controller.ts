import {catchAsync} from 'errorHandling';
import db from 'db';

export const retrieve = catchAsync(async (req, res) => {
  const jobId = req.params.jobId;
  const {tenantId} = req.user;
  const formCategory = req.query.formCategory as string;
  const data = await db.rankings.find(tenantId, jobId, formCategory);
  res.status(200).json(data);
});
