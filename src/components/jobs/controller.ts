import {S3} from 'aws-sdk';
import {dbSelectApplicants, TApplicant} from 'components/applicants';
import {catchAsync} from 'errorHandling';
import {dbInsertJob, dbSelectJobs, dbUpdateJob, dbDeleteJob} from './database';

export const createJob = catchAsync(async (req, res) => {
  const job = {
    job_title: req.body.job_title,
    tenant_id: res.locals.user.tenant_id,
    job_requirements: req.body.job_requirements,
  };

  const resp = await dbInsertJob(job);
  res.status(201).json(resp);
});

export const getJobs = catchAsync(async (req, res) => {
  const tenant_id = res.locals.user.tenant_id;
  const resp = await dbSelectJobs(tenant_id);
  res.status(200).json(resp);
});

export const updateJob = catchAsync(async (req, res) => {
  const job_id = req.params.job_id;
  const tenant_id = res.locals.user.tenant_id;

  const resp = await dbUpdateJob(job_id, tenant_id, req.body);
  res.status(200).json(resp);
});

export const deleteJob = catchAsync(async (req, res) => {
  const {job_id} = req.params;
  const {tenant_id, user_id} = res.locals.user;

  const applicants: Array<TApplicant> = await dbSelectApplicants({
    job_id,
    tenant_id,
    user_id,
  });

  const fileKeys = applicants.reduce((acc, {files}) => {
    if (!files) return acc;
    const keys = files?.map(({value}) => value);
    return acc.concat(keys);
  }, [] as Array<string>);

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
