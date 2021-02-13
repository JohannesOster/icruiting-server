import fs from 'fs';
import {S3} from 'aws-sdk';
import {IncomingForm} from 'formidable';
import {BaseError, catchAsync} from 'errorHandling';
import {getApplicantFileURLs} from './utils';
import db from 'infrastructure/db';
import {calcReport} from './report';

export const retrieve = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;

  const applicant = await db.applicants.retrieve(tenantId, applicantId);
  if (!applicant) throw new BaseError(404, 'Not Found');

  const resp = await getApplicantFileURLs(applicant.files).then((files) => ({
    ...applicant,
    files,
  }));

  res.status(200).json(resp);
});

export const list = catchAsync(async (req, res) => {
  const {jobId, offset, limit, orderBy, filter} = req.query as any;
  const {tenantId, userId} = req.user;
  const params = {tenantId, jobId, userId, offset, limit, orderBy, filter};
  const data = await db.applicants.list(params);

  // replace S3 filekeys with aws presigned URL
  const promises = data.applicants.map(({files, ...appl}) =>
    getApplicantFileURLs(files).then((files) => ({...appl, files})),
  );

  const applicants = await Promise.all(promises);
  res.status(200).json({applicants, totalCount: data.totalCount});
});

export const update = catchAsync(async (req, res, next) => {
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

      applicant = await db.applicants.retrieve(tenantId, applicantId);
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

export const getReport = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;
  type QueryType = {formCategory: 'screening' | 'assessment'};
  const {formCategory} = req.query as QueryType;

  const applicant = await db.applicants.retrieve(tenantId, applicantId);
  if (!applicant) throw new BaseError(404, 'Applicant Not Found');
  const job = await db.jobs.retrieve(tenantId, applicant.jobId);
  if (!job) throw new BaseError(404, 'Job Not Found');

  const data = await db.formSubmissions.prepareReport(tenantId, formCategory);
  const report = calcReport(data, applicantId, job.jobRequirements);

  res.status(200).json(report);
});

export const del = catchAsync(async (req, res) => {
  const {applicantId} = req.params;
  const {tenantId} = req.user;

  const applicant = await db.applicants.retrieve(tenantId, applicantId);
  if (!applicant) throw new BaseError(404, 'Not Found');

  if (applicant.files?.length) {
    const files = applicant.files;
    const s3 = new S3();
    const bucket = process.env.S3_BUCKET || '';
    const fileKeys = files.map(({value}) => ({Key: value}));
    const delParams = {Bucket: bucket, Delete: {Objects: fileKeys}};
    await s3.deleteObjects(delParams).promise();
  }

  await db.applicants.del(tenantId, applicantId);
  res.status(200).json({});
});
