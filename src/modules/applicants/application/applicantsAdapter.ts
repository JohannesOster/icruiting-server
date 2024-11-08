import fs from 'fs';
import pug from 'pug';
import formidable from 'formidable';
import {BaseError} from 'application';
import storageService from 'shared/infrastructure/services/storageService';
import {getApplicantFileURLs} from './utils';
import {calcReport} from './calcReport';
import {httpReqHandler} from 'shared/infrastructure/http';
import {DB} from '../infrastructure/repositories';
import {FormCategory} from 'modules/forms/domain';
import {BrowserManager} from './browserManager';

export const ApplicantsAdapter = (db: DB) => {
  const browserManager = new BrowserManager(5000);

  const _retrieveApplicantWithAttributes = async (tenantId: string, applicantId: string) => {
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

    return resp;
  };

  const retrieve = httpReqHandler(async (req) => {
    const resp = await _retrieveApplicantWithAttributes(req.user.tenantId, req.params.applicantId);
    return {body: resp};
  });

  const list = httpReqHandler(async (req) => {
    const {jobId, offset, limit, orderBy, ...filter} = req.query as any;

    const {tenantId, userId} = req.user;
    const params = {tenantId, jobId, userId, offset, limit, orderBy, filter};
    const data = await db.applicants.list(params);

    if (!data.totalCount) return {body: {applicants: [], totalCount: 0}};

    // UNCOMMENT TO HIDE NON CONFIRMED USERS
    // if (req.user.userRole !== 'admin') {
    //   data.applicants = data.applicants.filter(
    //     ({applicantStatus}) => applicantStatus === 'confirmed',
    //   );
    // }

    // replace S3 filekeys with aws presigned URL
    const promises = data.applicants.map(({files, ...appl}) =>
      getApplicantFileURLs(files).then((files) => ({...appl, files})),
    );

    const applicants = await Promise.all(promises);

    /* MAP formFieldId to lable */
    const form = (await db.forms.list(tenantId, {jobId, formCategory: 'application'}))[0];

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

    let applicant;
    return new Promise((resolve, reject) => {
      formidable({multiples: true}).parse(req, async (err, fields, files) => {
        if (err) return reject(err);
        const {formId} = fields;

        if (!formId) return reject(new BaseError(422, 'Missing formId field'));

        const form = await db.forms.retrieve(null, formId[0]);
        if (!form) return reject(new BaseError(404, 'Form Not Found'));

        applicant = await db.applicants.retrieve(tenantId, applicantId);
        if (!applicant) return reject(new BaseError(404, 'Not Found'));
        const oldFiles = applicant?.files;

        const map = await form.formFields.reduce(
          async (acc, item) => {
            if (!item.id) throw new BaseError(500, '');

            // !> filter out non submitted values
            const isFile = item.component === 'file_upload';
            const fieldVal = fields[item.id]?.[0];

            if (!fieldVal && !isFile) {
              if (!item.required) return acc;
              return reject(new BaseError(422, `Missing required field: ${item.label}`));
            }

            if (isFile) {
              const file = files[item.id]?.[0];

              const oldFile = oldFiles?.find(({formFieldId}) => formFieldId === item.id);

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

              const extension = file.originalFilename?.substr(
                file.originalFilename.lastIndexOf('.') + 1,
              );

              const fileId = (Math.random() * 1e32).toString(36);
              const fileKey = form.tenantId + '.' + fileId + '.' + extension;

              if (oldFile) await storageService.del(oldFile.uri);

              const fileStream = await fs.createReadStream(file.filepath);
              const params = {
                path: fileKey,
                contentType: file.mimetype || '',
                data: fileStream,
              };

              await storageService.upload(params);

              await new Promise((resolve, reject) => {
                fs.unlink(file.filepath, (error) => {
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

            (await acc).attributes.push({formFieldId: item.id, attributeValue: fieldVal});

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

    const data = await db.formSubmissions.prepareReport(tenantId, formCategory, job.id);

    const report = calcReport(data, applicantId, job.jobRequirements);

    return {body: report};
  });

  const getPersonalReport = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId, userId} = req.user;
    type QueryType = {formCategory: FormCategory};
    const {formCategory} = req.query as QueryType;

    const applicant = await db.applicants.retrieve(tenantId, applicantId);
    if (!applicant) throw new BaseError(404, 'Applicant Not Found');
    const job = await db.jobs.retrieve(tenantId, applicant.jobId);
    if (!job) throw new BaseError(404, 'Job Not Found');

    const data = await db.formSubmissions.prepareReport(tenantId, formCategory, job.id, userId);
    const report = calcReport(data, applicantId, job.jobRequirements);

    return {body: report};
  });

  const getTEReport = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId} = req.user;
    type QueryType = {formId: FormCategory};
    const {formId} = req.query as QueryType;

    const applicant = await db.applicants.retrieve(tenantId, applicantId);
    if (!applicant) throw new BaseError(404, 'Applicant Not Found');
    const job = await db.jobs.retrieve(tenantId, applicant.jobId);
    if (!job) throw new BaseError(404, 'Job Not Found');

    const data = await db.formSubmissions.prepareTEReport(tenantId, formId, job.id);

    const report = calcReport(data, applicantId, job.jobRequirements);

    return {body: report};
  });

  const getPDFReport = httpReqHandler(async (req) => {
    const {applicantId} = req.params;
    const {tenantId} = req.user;
    type QueryType = {formCategory: FormCategory};
    const {formCategory} = req.query as QueryType;

    const applicant = await _retrieveApplicantWithAttributes(tenantId, applicantId);
    if (!applicant) throw new BaseError(404, 'Applicant Not Found');
    const job = await db.jobs.retrieve(tenantId, applicant.jobId);
    if (!job) throw new BaseError(404, 'Job Not Found');

    const data = await db.formSubmissions.prepareReport(tenantId, formCategory, job.id);
    const report = calcReport(data, applicantId, job.jobRequirements);

    const fullName = applicant.attributes?.find(
      (attr: any) => attr.key === 'Vollständiger Name',
    )?.value;

    const template = pug.compileFile(`${__dirname}/../infrastructure/http/views/report.pug`)({
      applicant: {...applicant, name: fullName},
      report,
      formCategory: 'assessment',
    });

    const pdf = await browserManager.renderPDF(template, {
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: ``,
      footerTemplate: `
      <div style="border-top: solid 1px #bbb; width: 100%; font-size: 12px;
          padding: 5px 5px 0; color: #bbb; position: relative;">
          <div style="position: absolute; right: 5px; top: 5px;"><span class="pageNumber"></span>/<span class="totalPages"></span></div>
      </div>
    `,
      // this is needed to prevent content from being placed over the footer
      margin: {top: '24px', bottom: '24px'},
    });

    return {file: Buffer.from(pdf)};
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

    const applicant = await db.applicants.updateApplicantStatus(tenantId, applicantId, 'confirmed');

    return {body: applicant};
  });

  return {
    retrieve,
    list,
    update,
    getReport,
    del,
    confirm,
    getTEReport,
    getPDFReport,
    getPersonalReport,
  };
};
