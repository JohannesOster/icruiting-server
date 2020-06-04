import {RequestHandler} from 'express';
import {insertJob} from '../../db/jobs.db';
import {validationResult} from 'express-validator';

export const createJob: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  const job = {
    job_title: req.body.job_title,
    organization_id: res.locals.user.orgID,
    requirements: req.body.requirements,
  };

  insertJob(job)
    .then((resp: any) => {
      res.status(201).json(resp);
    })
    .catch((error: any) => {
      next(error);
    });
};
