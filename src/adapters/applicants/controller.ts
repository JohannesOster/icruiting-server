import fs from 'fs';
import {S3} from 'aws-sdk';
import {IncomingForm} from 'formidable';
import {BaseError, httpReqHandler} from 'adapters/errorHandling';
import {getApplicantFileURLs} from './utils';
import db from 'infrastructure/db';
import {calcReport} from './report';

export const ApplicantsAdapter = () => {
  const retrieve = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId} = req.user;

    const applicant = await db.applicants.retrieve(tenantId, applicantId);
    if (!applicant) throw new BaseError(404, 'Not Found');

    const resp = await getApplicantFileURLs(applicant.files).then((files) => ({
      ...applicant,
      files,
    }));

    return {body: resp};
  });

  const list = httpReqHandler(async (req) => {
    const {jobId, offset, limit, orderBy, filter} = req.query as any;
    const {tenantId, userId} = req.user;
    const params = {tenantId, jobId, userId, offset, limit, orderBy, filter};
    const data = await db.applicants.list(params);

    // replace S3 filekeys with aws presigned URL
    const promises = data.applicants.map(({files, ...appl}) =>
      getApplicantFileURLs(files).then((files) => ({...appl, files})),
    );

    const applicants = await Promise.all(promises);
    return {body: {applicants, totalCount: data.totalCount}};
  });

  const update = httpReqHandler((req) => {
    const {tenantId} = req.user;
    const {applicantId} = req.params;
    const formidable = new IncomingForm({multiples: true} as any);

    let applicant;
    return new Promise((resolve, reject) => {
      formidable.parse(req, async (err: Error, fields: any, files: any) => {
        if (err) return reject(err);
        const s3 = new S3();
        const bucket = process.env.S3_BUCKET || '';
        const {formId} = fields;

        if (!formId) return reject(new BaseError(422, 'Missing formId field'));

        const form = await db.forms.retrieve(null, formId);
        if (!form) return reject(new BaseError(404, 'Form Not Found'));

        applicant = await db.applicants.retrieve(tenantId, applicantId);
        if (!applicant) return reject(new BaseError(404, 'Not Found'));
        const oldFiles = applicant?.files;

        const map = await form.formFields.reduce(
          async (acc, item) => {
            if (!item.formFieldId) throw new BaseError(500, '');

            // !> filter out non submitted values
            const isFile = item.component === 'file_upload';
            if (!fields[item.formFieldId] && !isFile) {
              if (item.required) {
                return reject(
                  new BaseError(422, `Missing required field: ${item.label}`),
                );
              }
              return acc;
            }

            if (isFile) {
              const file = files[item.formFieldId];

              const oldFile = oldFiles?.find(
                ({key}: any) => key === item.label,
              );
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

              const extension = file.name.substr(
                file.name.lastIndexOf('.') + 1,
              );

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

              await new Promise((resolve, reject) => {
                fs.unlink(file.path, (error) => {
                  if (error) return reject(new BaseError(500, error.message));
                  resolve({});
                });
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

        resolve({
          status: 200,
          body: appl,
        });
      });
    });
  });

  const getReport = httpReqHandler(async (req) => {
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

    return {body: report};
  });

  const del = httpReqHandler(async (req) => {
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
    return {};
  });

  return {retrieve, list, update, getReport, del};
};