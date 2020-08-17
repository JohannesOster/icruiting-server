import {RequestHandler} from 'express';
import {dbSelectApplicants} from './database';
import {getApplicantFileURLs} from './utils';

export const getApplicants: RequestHandler = (req, res, next) => {
  const job_id = req.query.job_id as string;
  const {orgID: organization_id, sub: user_id} = res.locals.user;
  const params = {organization_id, user_id, job_id};

  dbSelectApplicants(params)
    .then((resp) => {
      // replace S3 filekeys with aws presigned URL
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
