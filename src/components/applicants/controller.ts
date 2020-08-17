import {RequestHandler} from 'express';
import {dbSelectApplicants} from './database';
import {getApplicantFileURLs} from './utils';

export const getApplicants: RequestHandler = (req, res, next) => {
  const job_id = req.query.job_id as string;

  dbSelectApplicants({
    organization_id: res.locals.user.orgID,
    job_id,
    user_id: res.locals.user.sub,
  })
    .then((resp) => {
      /* For each applicant, loop through files property
       * and get actual aws s3 url for each single file
       */
      const promises = resp.map((appl) => {
        return new Promise((resolve, reject) => {
          return getApplicantFileURLs(appl.files)
            .then((files) => resolve({...appl, files}))
            .catch(reject);
        });
      });

      Promise.all(promises).then((data) => res.status(200).json(data));
    })

    .catch(next);
};
