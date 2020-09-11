import {catchAsync} from 'errorHandling';
import {dbSelectApplicants, dbSelectReport} from './database';
import {getApplicantFileURLs} from './utils';
import {
  TScreeningRankingRow,
  TScreeningResultObject,
  EFormItemIntent,
  KeyVal,
} from '../rankings/types';

export const getApplicants = catchAsync(async (req, res, next) => {
  const job_id = req.query.job_id as string;
  const {orgID: organization_id, sub: user_id} = res.locals.user;
  const params = {organization_id, user_id, job_id};

  const applicants = await dbSelectApplicants(params);

  // replace S3 filekeys with aws presigned URL
  const promises = applicants.map((appl) => {
    return new Promise((resolve, reject) => {
      return getApplicantFileURLs(appl.files)
        .then((files) => resolve({...appl, files}))
        .catch(reject);
    });
  });

  const resp = await Promise.all(promises);
  res.status(200).json(resp);
});

export const getReport = catchAsync(async (req, res) => {
  const applicant_id = req.params.applicant_id;
  const {orgID: organization_id} = res.locals.user;
  const {form_category} = req.query as {
    form_category: 'screening' | 'assessment';
  };

  const params = {applicant_id, organization_id, form_category};
  const data = await dbSelectReport(params);

  const resp = data.map((row: TScreeningRankingRow) => {
    const {submissions} = row;
    const jobres = {} as any;
    const initialValues = (key: EFormItemIntent) => {
      return {
        [EFormItemIntent.sumUp]: 0,
        [EFormItemIntent.aggregate]: [],
        [EFormItemIntent.countDistinct]: {},
      }[key];
    };

    const submissionsResult = submissions.reduce((acc, curr) => {
      curr.forEach(
        ({form_item_id, intent, value, label, job_requirement_label}: any) => {
          if (!acc[form_item_id]) {
            const initialVal = initialValues(intent);
            acc[form_item_id] = {label, intent, value: initialVal};
          }
          switch (intent) {
            case EFormItemIntent.sumUp:
              (acc[form_item_id].value as number) += parseFloat(value);
              if (job_requirement_label)
                jobres[job_requirement_label] =
                  (jobres[job_requirement_label] || 0) + parseFloat(value);
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
        },
      );

      return acc;
    }, {} as TScreeningResultObject);

    return {
      result: submissionsResult,
      job_requirements_result: jobres,
      ...row,
    };
  });

  res.status(200).json(resp);
});
