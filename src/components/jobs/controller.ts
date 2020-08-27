import {RequestHandler} from 'express';
import {dbInsertJob, dbSelectJobs, dbUpdateJob} from './database';

export const createJob: RequestHandler = (req, res, next) => {
  const job = {
    job_title: req.body.job_title,
    organization_id: res.locals.user.orgID,
    job_requirements: req.body.job_requirements,
  };

  dbInsertJob(job)
    .then((resp) => res.status(201).json(resp))
    .catch(next);
};

export const getJobs: RequestHandler = (req, res, next) => {
  const organization_id = res.locals.user.orgID;
  dbSelectJobs(organization_id)
    .then((resp) => res.status(200).json(resp))
    .catch(next);
};

export const updateJob: RequestHandler = (req, res, next) => {
  const job_id = req.params.job_id;
  const organization_id = res.locals.user.orgID;

  dbUpdateJob(job_id, organization_id, req.body)
    .then((resp) => res.status(200).json(resp))
    .catch(next);
};
