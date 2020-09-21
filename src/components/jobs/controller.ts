import {S3} from 'aws-sdk';
import {dbSelectApplicants, TApplicant} from 'components/applicants';
import {BaseError, catchAsync} from 'errorHandling';
import {dbInsertJob, dbSelectJobs, dbUpdateJob, dbDeleteJob} from './database';

export const createJob = catchAsync(async (req, res) => {
  const {job_title, job_requirements} = req.body;
  const {tenant_id} = res.locals.user;
  const params = {job_title, tenant_id, job_requirements};
  const resp = await dbInsertJob(params);
  res.status(201).json(resp);
});

export const getJobs = catchAsync(async (req, res) => {
  const {tenant_id} = res.locals.user;
  const resp = await dbSelectJobs(tenant_id);
  res.status(200).json(resp);
});

export const getJob = catchAsync(async (req, res) => {
  const {job_id} = req.params;
  const {tenant_id} = res.locals.user;
  const resp = await dbSelectJobs(tenant_id, job_id);
  if (!resp) throw new BaseError(404, 'Not Found');
  res.status(200).json(resp);
});

export const updateJob = catchAsync(async (req, res) => {
  const {job_id} = req.params;
  const {tenant_id} = res.locals.user;
  const resp = await dbUpdateJob(job_id, tenant_id, req.body);
  res.status(200).json(resp);
});

export const deleteJob = catchAsync(async (req, res) => {
  const {job_id} = req.params;
  const {tenant_id, user_id} = res.locals.user;

  const params = {job_id, tenant_id, user_id};
  const applicants: TApplicant[] = await dbSelectApplicants(params);

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

  await dbDeleteJob(job_id, tenant_id);

  res.status(200).json({});
});
