import fs from 'fs';
import {IncomingForm} from 'formidable';
import {BaseError} from 'application';
import storageService from 'infrastructure/storageService';
import {getApplicantFileURLs} from './utils';
import {calcReport} from './calcReport';
import {httpReqHandler} from 'shared/infrastructure/http';
import {DB} from '../infrastructure/repositories';
import {FormCategory} from 'modules/forms/domain';

export const ApplicantsAdapter = (db: DB) => {
  const retrieve = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId} = req.user;

    const applicant = await db.applicants.retrieve(tenantId, applicantId);
    if (!applicant) throw new BaseError(404, 'Not Found');

    const resp = await getApplicantFileURLs(applicant.files).then((files) => ({
      ...applicant,
      files,
    }));

    /* MAP formFieldId to lable */
    const form = (
      await db.forms.list(tenantId, {
        formCategory: 'application',
        jobId: applicant.jobId,
      })
    )[0];

    if (!form) throw new BaseError(404, 'Application form Not Found');
    const formFields = form.formFields.reduce((acc, curr) => {
      acc[curr.id] = curr.label;
      return acc;
    }, {} as any);

    resp.attributes = applicant.attributes.map((attr) => ({
      ...attr,
      key: formFields[attr.formFieldId],
    }));

    resp.files = resp.files.map((file) => ({
      ...file,
      key: formFields[file.formFieldId],
    }));

    return {body: resp};
  });

  const list = httpReqHandler(async (req) => {
    const {jobId, offset, limit, orderBy, ...filter} = req.query as any;

    const {tenantId, userId} = req.user;
    const params = {tenantId, jobId, userId, offset, limit, orderBy, filter};
    const data = await db.applicants.list(params);

    if (!data.totalCount) return {body: {applicants: [], totalCount: 0}};

    if (req.user.userRole !== 'admin') {
      data.applicants = data.applicants.filter(
        ({applicantStatus}) => applicantStatus === 'confirmed',
      );
    }

    // replace S3 filekeys with aws presigned URL
    const promises = data.applicants.map(({files, ...appl}) =>
      getApplicantFileURLs(files).then((files) => ({...appl, files})),
    );

    const applicants = await Promise.all(promises);

    /* MAP formFieldId to lable */
    const form = (
      await db.forms.list(tenantId, {jobId, formCategory: 'application'})
    )[0];

    if (!form) throw new BaseError(404, 'Application form Not Found');
    const formFields = form.formFields.reduce((acc, curr) => {
      acc[curr.id] = curr.label;
      return acc;
    }, {} as any);

    const appls = applicants.map((appl) => {
      appl.attributes = appl.attributes.map((attr) => ({
        ...attr,
        key: formFields[attr.formFieldId],
      }));

      appl.files = appl.files.map((file) => ({
        ...file,
        key: formFields[file.formFieldId],
      }));

      return appl;
    });

    return {body: {applicants: appls, totalCount: data.totalCount}};
  });

  const update = httpReqHandler((req) => {
    const {tenantId} = req.user;
    const {applicantId} = req.params;
    const formidable = new IncomingForm({multiples: true} as any);

    let applicant;
    return new Promise((resolve, reject) => {
      formidable.parse(req, async (err: Error, fields: any, files: any) => {
        if (err) return reject(err);
        const {formId} = fields;

        if (!formId) return reject(new BaseError(422, 'Missing formId field'));

        const form = await db.forms.retrieve(null, formId);
        if (!form) return reject(new BaseError(404, 'Form Not Found'));

        applicant = await db.applicants.retrieve(tenantId, applicantId);
        if (!applicant) return reject(new BaseError(404, 'Not Found'));
        const oldFiles = applicant?.files;

        const map = await form.formFields.reduce(
          async (acc, item) => {
            if (!item.id) throw new BaseError(500, '');

            // !> filter out non submitted values
            const isFile = item.component === 'file_upload';

            if (!fields[item.id] && !isFile) {
              if (!item.required) return acc;
              return reject(
                new BaseError(422, `Missing required field: ${item.label}`),
              );
            }

            if (isFile) {
              const file = files[item.id];

              const oldFile = oldFiles?.find(
                ({formFieldId}) => formFieldId === item.id,
              );

              const fileExists = !!(file && file.size);
              if (!fileExists) {
                if (!oldFile) return acc;
                const oldFileAttribute = {
                  formFieldId: item.id,
                  attributeValue: oldFile.uri,
                };
                (await acc).attributes.push(oldFileAttribute);
                return acc;
              }

              const extension = file.name.substr(
                file.name.lastIndexOf('.') + 1,
              );

              const fileId = (Math.random() * 1e32).toString(36);
              const fileKey = form.tenantId + '.' + fileId + '.' + extension;

              if (oldFile) await storageService.del(oldFile.uri);

              const fileStream = await fs.createReadStream(file.path);
              const params = {
                path: fileKey,
                contentType: file.type,
                data: fileStream,
              };

              await storageService.upload(params);

              await new Promise((resolve, reject) => {
                fs.unlink(file.path, (error) => {
                  if (error) return reject(new BaseError(500, error.message));
                  resolve({});
                });
              });

              (await acc).attributes.push({
                formFieldId: item.id,
                attributeValue: fileKey,
              });

              return acc;
            }

            (await acc).attributes.push({
              formFieldId: item.id,
              attributeValue: fields[item.id],
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

        resolve({status: 200, body: appl});
      });
    });
  });

  const getReport = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId} = req.user;
    type QueryType = {formCategory: FormCategory};
    const {formCategory} = req.query as QueryType;

    const applicant = await db.applicants.retrieve(tenantId, applicantId);
    if (!applicant) throw new BaseError(404, 'Applicant Not Found');
    const job = await db.jobs.retrieve(tenantId, applicant.jobId);
    if (!job) throw new BaseError(404, 'Job Not Found');

    const data = await db.formSubmissions.prepareReport(
      tenantId,
      formCategory,
      job.id,
    );

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
      const fileKeys = files.map(({uri}) => uri);
      await storageService.bulkDel(fileKeys);
    }

    await db.applicants.del(tenantId, applicantId);

    return {};
  });

  const confirm = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId} = req.user;

    const applicant = await db.applicants.updateApplicantStatus(
      tenantId,
      applicantId,
      'confirmed',
    );

    return {body: applicant};
  });

  return {retrieve, list, update, getReport, del, confirm};
};
