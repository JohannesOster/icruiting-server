import {RequestHandler} from 'express';
import {selectApplicants} from '../../db/applicants.db';

export const getApplicants: RequestHandler = (req, res, next) => {
  const job_id = req.query.job_id as string;

  selectApplicants({
    organization_id: res.locals.user.orgID,
    job_id,
  })
    .then((applicants) => {
      res.status(200).json(applicants);
    })
    .catch(next);
};
