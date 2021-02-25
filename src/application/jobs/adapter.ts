import db from 'infrastructure/db';
import storageService from 'infrastructure/storageService';
import {BaseError, httpReqHandler} from 'application/errorHandling';
import {createForm, createJob, Form, Job} from 'domain/entities';
import fs from 'fs';
import {IncomingForm} from 'formidable';

export const JobsAdapter = () => {
  const retrieve = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;
    const resp = await db.jobs.retrieve(tenantId, jobId);
    if (!resp) throw new BaseError(404, 'Not Found');
    return {body: resp};
  });

  const create = httpReqHandler(async (req) => {
    const {jobTitle, jobRequirements} = req.body;
    const {tenantId} = req.user;
    const job = createJob({jobTitle, tenantId, jobRequirements});
    return db.jobs.create(job).then((body) => ({status: 201, body}));
  });

  const update = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;
    const job = createJob({...req.body, jobId, tenantId});
    return db.jobs.update(job).then((body) => ({status: 200, body}));
  });

  const del = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId, userId} = req.user;

    const query = {tenantId, jobId, userId};
    const {applicants} = await db.applicants.list(query);

    const fileKeys = applicants.reduce((acc, {files}) => {
      if (!files) return acc;
      const keys = files?.map(({uri}) => uri);
      return acc.concat(keys);
    }, [] as string[]);

    if (fileKeys.length) await storageService.bulkDel(fileKeys);

    return db.jobs.del(tenantId, jobId).then(() => ({}));
  });

  const list = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    return db.jobs.list(tenantId).then((body) => ({body}));
  });

  const createReport = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    return db.jobs
      .createReport(tenantId, jobId, req.body)
      .then((body) => ({status: 201, body}));
  });

  const retrieveReport = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    return db.jobs.retrieveReport(tenantId, jobId).then((body) => ({body}));
  });

  const updateReport = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    return await db.jobs
      .updateReport(tenantId, jobId, req.body)
      .then((body) => ({body}));
  });

  const delReport = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    return await db.jobs.delReport(tenantId, jobId).then(() => ({}));
  });

  const exportJob = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    const job = await db.jobs.retrieve(tenantId, jobId);
    if (!job) throw new BaseError(404, 'Not Found');

    const forms = await db.forms.list(tenantId, {jobId});

    const body = {
      jobTitle: job.jobTitle,
      jobRequirements: job.jobRequirements.map(
        ({jobRequirementId, jobId, ...requirement}) => requirement,
      ),
      forms: forms.map((form) => ({
        formCategory: form.formCategory,
        formTitle: form.formTitle,
        replicaOf: form.replicaOf,
        formFields: form.formFields.map(
          ({jobRequirementId, formId, formFieldId, ...formField}) => ({
            ...formField,
          }),
        ),
      })),
    };

    return {body};
  });

  const importJob = httpReqHandler(async (req) => {
    const {tenantId} = req.user;

    return new Promise((resolve, reject) => {
      const formidable = new IncomingForm();
      formidable.parse(req, async (error, fields, files) => {
        try {
          if (error) return reject(new BaseError(500, error));
          const file = files.job;
          if (Array.isArray(file))
            return reject(new BaseError(422, 'Multifile no supported.'));
          const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
          if (extension !== 'json')
            return reject(
              new BaseError(422, `Invalid fileformat ${extension}`),
            );

          const rawData = (await new Promise((resolve, reject) => {
            fs.readFile(file.path, (error, data) => {
              if (error) return reject(new BaseError(500, error.message));
              resolve(data);
            });
          })) as Buffer;

          const json = JSON.parse(rawData.toString());

          const {forms, ...job} = json;
          const _job = await db.jobs.create(createJob({tenantId, ...job}));

          const _forms = await Promise.all(
            (forms as Form[])
              .filter((form) => !form.replicaOf)
              .map((form) =>
                db.forms.create(
                  createForm({...form, tenantId, jobId: _job.jobId}),
                ),
              ),
          );

          const body = {..._job, forms: _forms};
          resolve({status: 201, body});
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  return {
    create,
    retrieve,
    update,
    del,
    list,
    createReport,
    retrieveReport,
    updateReport,
    delReport,
    exportJob,
    importJob,
  };
};
