import fs from 'fs';
import pug from 'pug';
import path from 'path';
import {S3} from 'aws-sdk';
import puppeteer from 'puppeteer';
import {IncomingForm} from 'formidable';
import {BaseError, catchAsync} from 'errorHandling';
import {
  dbSelectApplicants,
  dbSelectReport,
  dbDeleteApplicant,
  dbUpdateApplicant,
  dbSelectApplicant,
} from './database';
import {getApplicantFileURLs, sortApplicants, round} from './utils';
import {
  TScreeningRankingRow,
  TScreeningResultObject,
  EFormItemIntent,
  KeyVal,
} from '../rankings/types';
import {dbSelectForm, TForm} from '../forms';
import {TApplicant} from './types';

export const getApplicants = catchAsync(async (req, res, next) => {
  const job_id = req.query.job_id as string;
  const {tenant_id, user_id} = res.locals.user;
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
  const sortedResp = sortApplicants(resp, sortKey);

  res.status(200).json(sortedResp);
});

export const getReport = catchAsync(async (req, res) => {
  const {applicant_id} = req.params;
  const {tenant_id} = res.locals.user;
  type QueryType = {form_category: 'screening' | 'assessment'};
  const {form_category} = req.query as QueryType;

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
          const average = round(val / submissions.length);
          acc[key] = {...value, value: average};
          return acc;
        }

        acc[key] = value;
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

  const applicant: TApplicant = await dbSelectApplicant(
    applicant_id,
    tenant_id,
  );
  if (!applicant) throw new BaseError(404, 'Not Found');

  if (applicant.files?.length) {
    const files = applicant.files;
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const fileKeys = files.map(({value}) => ({Key: value}));
    const delParams = {Bucket: bucket, Delete: {Objects: fileKeys}};
    await s3.deleteObjects(delParams).promise();
  }

  await dbDeleteApplicant(applicant_id, tenant_id);
  res.status(200).json({});
});

export const updateApplicant = catchAsync(async (req, res, next) => {
  const {tenant_id} = res.locals.user;
  const {applicant_id} = req.params;
  const formidable = new IncomingForm();

  formidable.parse(req, async (err: Error, fields: any, files: any) => {
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const {form_id} = fields;

    try {
      if (!form_id) throw new BaseError(422, 'Missing form_id field');

      const forms = await dbSelectForm(form_id);
      const form: TForm = forms[0];
      if (!form) throw new BaseError(404, 'Form Not Found');

      const applicant = await dbSelectApplicant(applicant_id, tenant_id);
      const oldFiles = applicant?.files;

      const map = await form.form_fields.reduce(
        async (acc, item) => {
          if (!item.form_field_id) throw new BaseError(500, '');

          // !> filter out non submitted values
          const isFile = item.component === 'file_upload';
          if (!fields[item.form_field_id] && !isFile) {
            if (item.required) {
              throw new BaseError(422, `Missing required field: ${item.label}`);
            }
            return acc;
          }

          if (isFile) {
            const file = files[item.form_field_id];

            const oldFile = oldFiles?.find(({key}: any) => key === item.label);
            const fileExists = file && file.size;
            if (fileExists) {
              if (!oldFile) return acc;

              const oldFileAttribute = {
                form_field_id: item.form_field_id,
                attribute_value: oldFile.value,
              };
              (await acc).attributes.push(oldFileAttribute);
              return acc;
            }

            const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
            const isPDF = extension === 'pdf';
            const fileType = isPDF ? 'application/pdf' : 'image/jpeg';

            const fileId = (Math.random() * 1e32).toString(36);
            let fileKey = form.tenant_id + '.' + fileId + '.' + extension;

            if (oldFile) {
              fileKey = oldFile.value;
              const params = {Bucket: bucket, Key: fileKey};
              await s3.deleteObject(params).promise();
            }

            const fileStream = await fs.createReadStream(file.path);
            const params = {
              Key: fileKey,
              Bucket: bucket,
              ContentType: fileType,
              Body: fileStream,
            };

            fs.unlink(file.path, function (err) {
              if (err) throw new BaseError(500, err.message);
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

      const appl = await dbUpdateApplicant(applicant_id, map.attributes);

      res.status(200).json(appl);
    } catch (error) {
      next(error);
    }
  });
});

export const getPdfReport = catchAsync(async (req, res) => {
  const {applicant_id} = req.params;
  const {tenant_id} = res.locals.user;

  const applicant: TApplicant = await dbSelectApplicant(
    applicant_id,
    tenant_id,
  );
  if (!applicant) throw new BaseError(404, 'Applicant not Found');

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
