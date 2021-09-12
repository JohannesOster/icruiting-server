import db from 'infrastructure/db';
import storageService from 'infrastructure/storageService';
import {BaseError} from 'application/errorHandling';
import {createForm, createJob, Form} from 'domain/entities';
import fs from 'fs';
import {IncomingForm} from 'formidable';
import {v4 as uuidv4} from 'uuid';
import {deepReplace} from './utils';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';

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

    const replace = {} as {[key: string]: string};
    const body = {
      jobTitle: job.jobTitle,
      jobRequirements: job.jobRequirements.map(({jobId, ...requirement}) => {
        replace[requirement.jobRequirementId] = uuidv4();
        return requirement;
      }),
      forms: forms.map((form) => {
        replace[form.formId] = uuidv4();
        return {
          formId: form.formId,
          formCategory: form.formCategory,
          formTitle: form.formTitle,
          replicaOf: form.replicaOf,
          // only add formFields to non replicas, otherwise formfields would be duplicated
          ...(form.replicaOf
            ? {formFields: []}
            : {
                formFields: form.formFields.map(
                  ({formId, formFieldId, ...formField}) => ({
                    ...formField,
                  }),
                ),
              }),
        };
      }),
    };

    return {body: deepReplace(body, replace)};
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
          if (!file.name)
            return reject(new BaseError(500, 'Missing file name'));

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

          const formsMap = (forms as Form[]).reduce(
            (acc, curr) => {
              if (!curr.replicaOf) acc.primaries.push(curr);
              else acc.replicas.push(curr);
              return acc;
            },
            {primaries: [], replicas: []} as {
              primaries: Form[];
              replicas: Form[];
            },
          );

          let _forms = await Promise.all(
            formsMap.primaries.map((form) =>
              db.forms.create(
                createForm({...form, tenantId, jobId: _job.jobId}),
              ),
            ),
          );

          _forms = _forms.concat(
            await Promise.all(
              formsMap.replicas.map((form) =>
                db.forms.create(
                  createForm({...form, tenantId, jobId: _job.jobId}),
                ),
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
