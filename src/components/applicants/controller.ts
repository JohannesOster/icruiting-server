import {RequestHandler} from 'express';
import {dbSelectApplicants, dbSelectReport} from './database';
import {getApplicantFileURLs} from './utils';
import {
  TScreeningRankingRow,
  TScreeningResultObject,
  EFormItemIntent,
  KeyVal,
} from '../rankings/types';

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

export const getReport: RequestHandler = (req, res, next) => {
  const applicant_id = req.params.applicant_id;
  const {orgID: organization_id} = res.locals.user;
  const {form_category} = req.query as {
    form_category: 'screening' | 'assessment';
  };

  const params = {applicant_id, organization_id, form_category};

  dbSelectReport(params).then((result) => {
    const tmp = result.map((row: TScreeningRankingRow) => {
      const {submissions} = row;

      const initialValues = (key: EFormItemIntent) => {
        return {
          [EFormItemIntent.sumUp]: 0,
          [EFormItemIntent.aggregate]: [],
          [EFormItemIntent.countDistinct]: {},
        }[key];
      };
      const submissionsResult = submissions.reduce((acc, curr) => {
        curr.forEach(({form_item_id, intent, value, label}) => {
          if (!acc[form_item_id]) {
            const initialVal = initialValues(intent);
            acc[form_item_id] = {label, intent, value: initialVal};
          }
          switch (intent) {
            case EFormItemIntent.sumUp:
              (acc[form_item_id].value as number) += +value;
              break;
            case EFormItemIntent.aggregate:
              acc[form_item_id].value = (acc[form_item_id].value as Array<
                string
              >).concat(value.toString());
              break;
            case EFormItemIntent.countDistinct:
              const key = value.toString();
              const currVal = (acc[form_item_id].value as KeyVal)[key];
              (acc[form_item_id].value as KeyVal)[key] = (currVal || 0) + 1;
          }
        });

        return acc;
      }, {} as TScreeningResultObject);

      return {result: submissionsResult, ...row};
    });

    res.status(200).json(tmp);
  });
};
