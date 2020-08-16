import {RequestHandler} from 'express';
import {selectApplicants} from './database';
import {S3} from 'aws-sdk';

export const getApplicants: RequestHandler = (req, res, next) => {
  const job_id = req.query.job_id as string;

  selectApplicants({
    organization_id: res.locals.user.orgID,
    job_id,
    user_id: res.locals.user.sub,
  })
    .then((resp) => {
      const s3 = new S3();
      /* For each applicant, loop through files property
       * and get actual aws s3 url for each single file
       */
      const promises = resp.map((appl) => {
        return new Promise((resolve, reject) => {
          const filePromises = appl.files.map((file: any) => {
            return s3
              .getSignedUrlPromise('getObject', {
                Bucket: process.env.S3_BUCKET,
                Key: 'applications/' + file.value,
                Expires: 100,
              })
              .then((url) => ({key: file.key, value: url}));
          });

          Promise.all(filePromises)
            .then((files) => resolve({...appl, files}))
            .catch(reject);
        });
      });

      Promise.all(promises).then((data) => {
        res.status(200).json(data);
      });
    })

    .catch(next);
};
