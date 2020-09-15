import {catchAsync} from 'errorHandling';
import {S3} from 'aws-sdk';
import {
  dbSelectApplicants,
  dbSelectReport,
  dbDeleteApplicant,
  dbSelectApplicantFiles,
} from './database';
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
        ({form_field_id, intent, value, label, job_requirement_label}: any) => {
          if (!acc[form_field_id]) {
            const initialVal = initialValues(intent);
            acc[form_field_id] = {label, intent, value: initialVal};
          }
          switch (intent) {
            case EFormItemIntent.sumUp:
              (acc[form_field_id].value as number) += parseFloat(value);
              if (job_requirement_label)
                jobres[job_requirement_label] =
                  (jobres[job_requirement_label] || 0) + parseFloat(value);
              break;
            case EFormItemIntent.aggregate:
              const val = value.toString();
              if (!val) break;
              const currArray = acc[form_field_id].value as Array<string>;
              acc[form_field_id].value = currArray.concat(val);
              break;
            case EFormItemIntent.countDistinct:
              const key = value.toString();
              const currVal = (acc[form_field_id].value as KeyVal)[key];
              (acc[form_field_id].value as KeyVal)[key] = (currVal || 0) + 1;
          }
        },
      );

      return acc;
    }, {} as TScreeningResultObject);

    const replaceSumByMean = Object.entries(submissionsResult).reduce(
      (acc, [key, value]) => {
        if (value.intent === EFormItemIntent.sumUp) {
          const val = value.value as number;
          acc[key] = {
            ...value,
            value: Math.round((100 * val) / submissions.length) / 100,
          };
        } else {
          acc[key] = value;
        }

        return acc;
      },
      {} as any,
    );

    return {
      result: replaceSumByMean,
      job_requirements_result: jobres,
      ...row,
    };
  });

  res.status(200).json(resp);
});

export const deleteApplicant = catchAsync(async (req, res) => {
  const {applicant_id} = req.params;

  const data = await dbSelectApplicantFiles(applicant_id);
  if (data[0] && data[0].files.length) {
    const files: [{key: string; value: string}] = data[0].files;
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const fileKeys = files.map(({value}) => ({Key: value}));
    const delParams = {Bucket: bucket, Delete: {Objects: fileKeys}};
    await s3.deleteObjects(delParams).promise();
  }

  await dbDeleteApplicant(applicant_id);
  res.status(200).json({});
});
