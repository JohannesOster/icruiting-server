import {catchAsync} from 'errorHandling';
import {dbInsertJob, dbSelectJobs, dbUpdateJob} from './database';

export const createJob = catchAsync(async (req, res) => {
  const job = {
    job_title: req.body.job_title,
    organization_id: res.locals.user.orgID,
    job_requirements: req.body.job_requirements,
  };

  const resp = await dbInsertJob(job);
  res.status(201).json(resp);
});

export const getJobs = catchAsync(async (req, res) => {
  const organization_id = res.locals.user.orgID;
  const resp = await dbSelectJobs(organization_id);
  res.status(200).json(resp);
});

export const updateJob = catchAsync(async (req, res) => {
  const job_id = req.params.job_id;
  const organization_id = res.locals.user.orgID;

  const resp = await dbUpdateJob(job_id, organization_id, req.body);
  res.status(200).json(resp);
});
