import {RequestHandler} from 'express';
import {insertJob, selectJobs} from '../../db/jobs.db';
import {validationResult} from 'express-validator';

export const createJob: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  const job = {
    job_title: req.body.job_title,
    organization_id: res.locals.user.orgID,
    job_requirements: req.body.job_requirements,
  };

  insertJob(job)
    .then((resp: any) => {
      res.status(201).json(resp);
    })
    .catch((error: any) => {
      next(error);
    });
};

export const getJobs: RequestHandler = (req, res, next) => {
  const organization_id = res.locals.user.orgID;
  selectJobs(organization_id)
    .then((resp) => {
      res.status(200).json(resp);
    })
    .catch((error: any) => {
      next(error);
    });
};
