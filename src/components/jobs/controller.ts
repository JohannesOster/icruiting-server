import {catchAsync} from 'errorHandling';
import {dbInsertJob, dbSelectJobs, dbUpdateJob} from './database';

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
