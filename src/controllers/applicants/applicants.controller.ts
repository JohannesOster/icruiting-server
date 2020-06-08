import {RequestHandler} from 'express';
import {selectApplicants} from '../../db/applicants.db';

export const getApplicants: RequestHandler = (req, res, next) => {
  const orgId = res.locals.user.orgID;
  selectApplicants(orgId)
    .then((applicants) => {
      res.status(200).json(applicants);
    })
    .catch(next);
};
