import {BaseError, catchAsync} from 'errorHandling';
import {S3, SESV2} from 'aws-sdk';
import {
  dbSelectApplicants,
  dbSelectReport,
  dbDeleteApplicant,
  dbSelectApplicantFiles,
  dbUpdateApplicant,
} from './database';
import {getApplicantFileURLs} from './utils';
import {
  TScreeningRankingRow,
  TScreeningResultObject,
  EFormItemIntent,
  KeyVal,
} from '../rankings/types';
import {dbSelectForm, TForm} from '../forms';
import {IncomingForm} from 'formidable';
import fs from 'fs';

export const getApplicants = catchAsync(async (req, res, next) => {
  const job_id = req.query.job_id as string;
  const {tenant_id, sub: user_id} = res.locals.user;
  const params = {tenant_id, user_id, job_id};

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
  const {tenant_id} = res.locals.user;
  const {form_category} = req.query as {
    form_category: 'screening' | 'assessment';
  };

  const params = {applicant_id, tenant_id, form_category};
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

export const updateApplicant = catchAsync(async (req, res, next) => {
  const {tenant_id} = res.locals.user;
  const {applicant_id} = req.params;
  const formidable = new IncomingForm({multiples: true} as any);

  formidable.parse(req, async (err: Error, fields: any, files: any) => {
    const s3 = new S3();

    try {
      const {form_id} = fields;
      if (!form_id) throw new BaseError(422, 'Missing form_id field');

      const forms = await dbSelectForm(form_id);
      if (!forms.length) throw new BaseError(404, 'Form Not Found');
      const form: TForm = forms[0];

      const oldFiles = (await dbSelectApplicantFiles(applicant_id))[0].files;

      const map = await form.form_fields.reduce(
        async (acc, item) => {
          if (!item.form_field_id) {
            throw new BaseError(
              500,
              'Received database entry without primary key',
            );
          }

          // !> filter out non submitted values
          if (
            !fields[item.form_field_id] &&
            (!files[item.form_field_id] || !files[item.form_field_id].size)
          ) {
            if (item.required)
              throw new BaseError(402, `Missing required field: ${item.label}`);
            return acc;
          }

          if (item.component === 'file_upload') {
            const file = files[item.form_field_id];
            const oldFile = oldFiles.find(({key}: any) => key === item.label);
            const fileKey = oldFile.value;
            const fileStream = await fs.createReadStream(file.path);

            // delete old file
            const delParams = {
              Bucket: process.env.S3_BUCKET || '',
              Key: fileKey,
            };

            await s3.deleteObject(delParams).promise();

            const params = {
              Key: fileKey,
              Bucket: process.env.S3_BUCKET || '',
              ContentType: 'application/pdf',
              Body: fileStream,
            };

            fs.unlink(file.path, function (err) {
              if (err) console.error(err);
              console.log('Temp File Delete');
            });

            await s3.upload(params).promise();
            return acc;
          }

          (await acc).attributes.push({
            key: item.label,
            value: fields[item.form_field_id],
          });

          return acc;
        },
        {attributes: []} as any,
      );

      const appl = await dbUpdateApplicant(
        tenant_id,
        applicant_id,
        map.attributes,
      );

      res.status(200).json(appl);
    } catch (error) {
      next(error);
    }
  });
});
