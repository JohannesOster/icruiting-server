import {S3} from 'aws-sdk';
import {BaseError, catchAsync} from 'errorHandling';
import db from 'db';

export const retrieve = catchAsync(async (req, res) => {
  const {jobId} = req.params;
  const {tenantId} = req.user;
  const resp = await db.jobs.find(tenantId, jobId);
  if (!resp) throw new BaseError(404, 'Not Found');
  res.status(200).json(resp);
});

export const create = catchAsync(async (req, res) => {
  const {jobTitle, jobRequirements} = req.body;
  const {tenantId} = req.user;
  const params = {jobTitle, tenantId, jobRequirements};
  const resp = await db.jobs.insert(params);
  res.status(201).json(resp);
});

export const update = catchAsync(async (req, res) => {
  const {jobId} = req.params;
  const {tenantId} = req.user;
  const resp = await db.jobs.update(tenantId, {...req.body, jobId});
  res.status(200).json(resp);
});

export const del = catchAsync(async (req, res) => {
  const {jobId} = req.params;
  const {tenantId, userId} = req.user;

  const {applicants} = await db.applicants.findAll({tenantId, jobId, userId});

  const fileKeys = applicants.reduce((acc, {files}) => {
    if (!files) return acc;
    const keys = files?.map(({value}) => value);
    return acc.concat(keys);
  }, [] as string[]);

  if (fileKeys.length) {
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const keys = fileKeys.map((key) => ({Key: key}));
    const delParams = {Bucket: bucket, Delete: {Objects: keys}};
    await s3.deleteObjects(delParams).promise();
  }

  await db.jobs.remove(tenantId, jobId);

  res.status(200).json({});
});

export const list = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const resp = await db.jobs.all(tenantId);
  res.status(200).json(resp);
});
