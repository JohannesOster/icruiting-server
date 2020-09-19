import {BaseError, catchAsync} from 'errorHandling';
import {S3} from 'aws-sdk';
import {
  dbSelectApplicants,
  dbSelectReport,
  dbDeleteApplicant,
  dbUpdateApplicant,
  dbSelectApplicant,
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
import pug from 'pug';
import path from 'path';
import puppeteer from 'puppeteer';
import {TApplicant} from './types';

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

  const resp: TApplicant[] = (await Promise.all(promises)) as any;
  const sortKey = 'Vollständiger Name';
  const sortedResp = resp.sort((first, second) => {
    const nameFirst = first.attributes.find(({key}) => key === sortKey)?.value;
    const nameSecond = second.attributes.find(({key}) => key === sortKey)
      ?.value;
    if (!nameFirst || !nameSecond) return 0;

    return nameFirst > nameSecond ? 1 : -1;
  });

  res.status(200).json(sortedResp);
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
  const {tenant_id} = res.locals.user;

  const data = await dbSelectApplicant(applicant_id, tenant_id);
  if (data[0] && data[0].files?.length) {
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

      const oldFiles = (await dbSelectApplicant(applicant_id, tenant_id))[0]
        .files;

      const map = await form.form_fields.reduce(
        async (acc, item) => {
          if (!item.form_field_id) {
            throw new BaseError(
              500,
              'Received database entry without primary key',
            );
          }

          // !> filter out non submitted values
          if (!fields[item.form_field_id] && item.component !== 'file_upload') {
            if (item.required)
              throw new BaseError(402, `Missing required field: ${item.label}`);
            return acc;
          }

          if (item.component === 'file_upload') {
            const file = files[item.form_field_id];

            const oldFile = oldFiles?.find(({key}: any) => key === item.label);
            if (!file || !file.size) {
              if (!oldFile) return acc;
              (await acc).attributes.push({
                form_field_id: item.form_field_id,
                attribute_value: oldFile.value,
              });

              return acc;
            }

            const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
            const fileType =
              extension === 'pdf' ? 'application/pdf' : 'image/jpeg';

            const fileId = (Math.random() * 1e32).toString(36);
            let fileKey = form.tenant_id + '.' + fileId + '.' + extension;

            if (oldFile) {
              fileKey = oldFile.value;

              // delete old file
              const delParams = {
                Bucket: process.env.S3_BUCKET || '',
                Key: fileKey,
              };

              await s3.deleteObject(delParams).promise();
            }

            const fileStream = await fs.createReadStream(file.path);
            const params = {
              Key: fileKey,
              Bucket: process.env.S3_BUCKET || '',
              ContentType: fileType,
              Body: fileStream,
            };

            fs.unlink(file.path, function (err) {
              if (err) console.error(err);
              console.log('Temp File Delete');
            });

            await s3.upload(params).promise();

            (await acc).attributes.push({
              form_field_id: item.form_field_id,
              attribute_value: fileKey,
            });

            return acc;
          }

          (await acc).attributes.push({
            form_field_id: item.form_field_id,
            attribute_value: fields[item.form_field_id],
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

export const getPdfReport = catchAsync(async (req, res) => {
  const {applicant_id} = req.params;
  const {tenant_id} = res.locals.user;

  const applicants: TApplicant[] = await dbSelectApplicant(
    applicant_id,
    tenant_id,
  );
  const applicant = applicants[0];
  if (!applicants.length) throw new BaseError(404, 'Applicant not Found');

  // might later be replaced with db entry
  const report = {
    image: 'Bewerbungsfoto (.jpeg)',
    attributes: ['Vollständiger Name', 'E-Mail-Addresse'],
  };

  const file = applicant.files?.find(({key}) => key === report.image);
  if (!file) throw new BaseError(404, 'Report image is missing on applicant');
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: file.value,
    Expires: 100,
  };
  const imageURL = await new S3().getSignedUrlPromise('getObject', params);

  const attributes = report.attributes.map((key) => {
    const attr = applicant.attributes.find((attr) => attr.key === key);
    if (!attr)
      throw new BaseError(404, 'Report attribute is missing on applicant');
    return attr;
  });

  const html = pug.renderFile(path.resolve(__dirname, 'report/report.pug'), {
    imageURL,
    attributes,
  });
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto(
    `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
    {waitUntil: 'networkidle0'},
  );
  const pdf = await page.pdf({format: 'A4'});
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});
