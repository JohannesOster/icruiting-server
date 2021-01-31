import fs from 'fs';
import pug from 'pug';
import path from 'path';
import {S3} from 'aws-sdk';
import puppeteer from 'puppeteer';
import {IncomingForm} from 'formidable';
import {BaseError, catchAsync} from 'errorHandling';
import {dbSelectReport, dbSelectApplicantReport} from './database';
import {getApplicantFileURLs} from './utils';
import db from 'db';
import {JobRequirement} from 'db/repos/jobs';

export const getApplicants = catchAsync(async (req, res) => {
  const {jobId, offset, limit, orderBy, filter} = req.query as any;
  const {tenantId, userId} = req.user;
  const params = {tenantId, jobId, userId, offset, limit, orderBy, filter};
  const data = await db.applicants.findAll(params);

  // replace S3 filekeys with aws presigned URL
  const promises = data.applicants.map(({files, ...appl}) =>
    getApplicantFileURLs(files).then((files) => ({...appl, files})),
  );

  const applicants = await Promise.all(promises);
  res.status(200).json({applicants, totalCount: data.totalCount});
});

export const getApplicant = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;

  const applicant = await db.applicants.find(tenantId, applicantId);
  if (!applicant) throw new BaseError(404, 'Not Found');

  const resp = await getApplicantFileURLs(applicant.files).then((files) => ({
    ...applicant,
    files,
  }));

  res.status(200).json(resp);
});

export const getReport = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;
  type QueryType = {formCategory: 'screening' | 'assessment'};
  const {formCategory} = req.query as QueryType;

  const params = {applicantId, tenantId, formCategory};
  const data = await dbSelectReport(params);
  if (!data) throw new BaseError(404, 'Not Found');

  res.status(200).json(data);
});

export const deleteApplicant = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;

  const applicant = await db.applicants.find(tenantId, applicantId);
  if (!applicant) throw new BaseError(404, 'Not Found');

  if (applicant.files?.length) {
    const files = applicant.files;
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const fileKeys = files.map(({value}) => ({Key: value}));
    const delParams = {Bucket: bucket, Delete: {Objects: fileKeys}};
    await s3.deleteObjects(delParams).promise();
  }

  await db.applicants.remove(tenantId, applicantId);
  res.status(200).json({});
});

export const updateApplicant = catchAsync(async (req, res, next) => {
  const {tenantId} = req.user;
  const {applicantId} = req.params;
  const formidable = new IncomingForm({multiples: true} as any);

  let applicant;
  formidable.parse(req, async (err: Error, fields: any, files: any) => {
    if (err) throw err;
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const {formId} = fields;

    try {
      if (!formId) throw new BaseError(422, 'Missing formId field');

      const form = await db.forms.retrieve(null, formId);
      if (!form) throw new BaseError(404, 'Form Not Found');

      applicant = await db.applicants.find(tenantId, applicantId);
      if (!applicant) throw new BaseError(404, 'Not Found');
      const oldFiles = applicant?.files;

      const map = await form.formFields.reduce(
        async (acc, item) => {
          if (!item.formFieldId) throw new BaseError(500, '');

          // !> filter out non submitted values
          const isFile = item.component === 'file_upload';
          if (!fields[item.formFieldId] && !isFile) {
            if (item.required) {
              throw new BaseError(422, `Missing required field: ${item.label}`);
            }
            return acc;
          }

          if (isFile) {
            const file = files[item.formFieldId];

            const oldFile = oldFiles?.find(({key}: any) => key === item.label);
            const fileExists = file && file.size;
            if (!fileExists) {
              if (!oldFile) return acc;

              const oldFileAttribute = {
                formFieldId: item.formFieldId,
                attributeValue: oldFile.value,
              };
              (await acc).attributes.push(oldFileAttribute);
              return acc;
            }

            const extension = file.name.substr(file.name.lastIndexOf('.') + 1);

            const fileId = (Math.random() * 1e32).toString(36);
            let fileKey = form.tenantId + '.' + fileId + '.' + extension;

            if (oldFile) {
              fileKey = oldFile.value;
              const params = {Bucket: bucket, Key: fileKey};
              await s3.deleteObject(params).promise();
            }

            const fileStream = await fs.createReadStream(file.path);
            const params = {
              Key: fileKey,
              Bucket: bucket,
              ContentType: file.type,
              Body: fileStream,
            };

            fs.unlink(file.path, (error) => {
              if (error) throw new BaseError(500, error.message);
            });

            await s3.upload(params).promise();

            (await acc).attributes.push({
              formFieldId: item.formFieldId,
              attributeValue: fileKey,
            });

            return acc;
          }

          (await acc).attributes.push({
            formFieldId: item.formFieldId,
            attributeValue: fields[item.formFieldId],
          });

          return acc;
        },
        {attributes: []} as any,
      );

      const params = {
        applicantId,
        tenantId,
        jobId: applicant.jobId,
        attributes: map.attributes,
      };
      const appl = await db.applicants.update(params);

      res.status(200).json(appl);
    } catch (error) {
      next(error);
    }
  });
});

export const getPdfReport = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;
  type Query = {formCategory?: 'screening' | 'assessment'};
  const {formCategory = 'screening'} = req.query as Query;

  const applicant = await db.applicants.find(tenantId, applicantId);
  if (!applicant) throw new BaseError(404, 'Applicant Not Found');

  const jobPromise = db.jobs.find(tenantId, applicant.jobId);
  const reportPromise = dbSelectApplicantReport(tenantId, applicant.jobId);
  const [job, applicantReport] = await Promise.all([jobPromise, reportPromise]);
  if (!job) throw new BaseError(404, 'Job Not Found');
  if (!applicantReport) throw new BaseError(404, 'Applicant Report Not Found');

  const htmlParams = {attributes: []} as any;
  if (applicantReport) {
    if (applicantReport.image) {
      const imageURL = await getFileURL(
        applicantReport.image.label,
        applicant.files,
      );
      if (imageURL) htmlParams.imageURL = imageURL;
    }

    const attributes = applicantReport.attributes.map(({label}) => {
      const attr = applicant.attributes.find((attr) => attr.key === label);
      if (!attr) {
        throw new BaseError(404, 'Report attribute is missing on applicant');
      }

      return attr;
    });

    htmlParams.attributes = attributes;
  }

  const formCategoryMap = {
    screening: 'Screening',
    assessment: 'Assessment',
  };
  htmlParams.formCategory = formCategoryMap[formCategory];

  const report = await dbSelectReport({tenantId, applicantId, formCategory});
  if (!report) throw new BaseError(404, 'Not Found');

  htmlParams.rank = report.rank;
  htmlParams.score = report.score;
  htmlParams.standardDeviation = report.standardDeviation;

  if (formCategory === 'assessment') {
    htmlParams.shouldPlot = true;
    htmlParams.chartData = buildRadarChart(job.jobRequirements, report);
  }

  const html = pug.renderFile(
    path.resolve(__dirname, 'report/report.pug'),
    htmlParams,
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
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

const getFileURL = (
  fileName: string,
  applicantFiles?: {[key: string]: string}[],
) => {
  const imageKey = applicantFiles?.find(({key}) => key === fileName)?.value;
  if (!imageKey) return;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: imageKey,
    Expires: 100,
  };
  return new S3().getSignedUrlPromise('getObject', params);
};

const buildRadarChart = (jobRequirements: JobRequirement[], report: any) => {
  const labels = jobRequirements.map(({requirementLabel}) => requirementLabel);
  const scores = jobRequirements.map(
    ({requirementLabel}) => report.jobRequirementsResult[requirementLabel] || 0,
  );

  const means = jobRequirements.map(({requirementLabel}) => {
    return report.normalization?.find(
      ({jobRequirementLabel}: any) => requirementLabel === jobRequirementLabel,
    )?.mean;
  });

  const minValsRaw = jobRequirements.map(({minValue}) => +(minValue || 0));
  const minVals = minValsRaw.map((val, index) => val / +(means[index] || 1));

  return {
    labels,
    datasets: [
      {
        label: 'Erzielter Wert',
        data: scores,
        backgroundColor: 'rgb(15,91,165, 0.5)',
      },
      {label: 'Mindestmaß', data: minVals},
    ],
  };
};
