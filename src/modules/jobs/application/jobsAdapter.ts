import fs from 'fs';
import storageService from 'infrastructure/storageService';
import {BaseError} from 'application';
import {File, IncomingForm} from 'formidable';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';
import {DB} from '../infrastructure/repositories';
import jobsMapper from '../mappers/jobsMapper';
import {createJob, createJobRequirement} from '../domain';
import {DBJob} from '../infrastructure/repositories/jobsRepository';
import {Form as DBForm} from 'modules/forms/infrastructure/db/repositories/forms/types';
import {formsMapper} from 'modules/forms/mappers';
import {createForm} from 'modules/forms/domain';
import {formFieldsMapper} from 'modules/forms/mappers/formFieldsMapper';
import {createId} from 'shared/domain/id';

export const JobsAdapter = (db: DB) => {
  const retrieve = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;
    const resp = await db.jobs.retrieve(tenantId, jobId);
    if (!resp) throw new BaseError(404, 'Not Found');
    return {body: jobsMapper.toDTO(tenantId, resp)};
  });

  const create = httpReqHandler(async (req) => {
    const {jobTitle, jobRequirements: _jobRequirements} = req.body;
    const {tenantId} = req.user;
    const jobRequirements = _jobRequirements.map((req: any) => {
      return createJobRequirement(req);
    });
    const job = createJob({jobTitle, jobRequirements});
    const params = jobsMapper.toPersistance(tenantId, job);
    const raw = await db.jobs.create(params);
    const body = jobsMapper.toDTO(tenantId, raw);

    return {status: 201, body};
  });

  const update = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;

    const jobRequirements = req.body.jobRequirements.map((req: any) => {
      return createJobRequirement(req, req.jobRequirementId);
    });

    const job = createJob({...req.body, jobRequirements}, jobId);
    const params = jobsMapper.toPersistance(tenantId, job);
    const raw = await db.jobs.update(params);
    const body = jobsMapper.toDTO(tenantId, raw);

    return {status: 200, body};
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
    return db.jobs
      .list(tenantId)
      .then((jobs) => jobs.map((job) => jobsMapper.toDTO(tenantId, job)))
      .then((body) => ({body}));
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
    const jobDTO = jobsMapper.toDTO(tenantId, job);

    const forms = await db.forms.list(tenantId, {jobId});

    const body = {
      // remove tenantId
      jobId: jobDTO.jobId,
      jobTitle: jobDTO.jobTitle,
      jobRequirements: jobDTO.jobRequirements, // will be changed in import
      forms: forms.map((form) => {
        return {
          formId: form.id,
          formCategory: form.formCategory,
          formTitle: form.formTitle,
          replicaOf: form.replicaOf,
          // only add formFields to non replicas, otherwise formFields would be duplicated
          ...(form.replicaOf
            ? {formFields: []}
            : {
                formFields: form.formFields.map((field) => {
                  const {formFieldId, ...formField} = formFieldsMapper.toDTO(
                    {formId: form.id},
                    field,
                  );
                  return formField;
                }),
              }),
        };
      }),
    };

    return {body: body};
  });

  const _validateJobFile = (file: File | File[]) => {
    if (Array.isArray(file))
      throw new BaseError(422, 'Multifile no supported.');
    if (!file.name) throw new BaseError(500, 'Missing file name');

    const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
    if (extension !== 'json')
      throw new BaseError(422, `Invalid fileformat ${extension}`);

    return file;
  };

  const _readJSONFile = async (file: File) => {
    const data = await new Promise<Buffer>((resolve, reject) => {
      fs.readFile(file.path, (error, data) => {
        if (error) return reject(new BaseError(500, error.message));
        resolve(data);
      });
    });

    return JSON.parse(data.toString());
  };

  const _insertJSONJob = (tenantId: string, params: DBJob) => {
    const {jobRequirements, ..._job} = params;

    const job = createJob({
      ..._job,
      jobRequirements: jobRequirements.map((req) => createJobRequirement(req)),
    });

    return db.jobs.create(jobsMapper.toPersistance(tenantId, job));
  };

  const _insertForms = (tenantId: string, jobId: string, forms: DBForm[]) => {
    return Promise.all(
      forms.map(({formFields: _formFields, ...form}) => {
        const formFields = _formFields.map(
          ({formFieldId, ...field}) =>
            formFieldsMapper.toDomain({
              formFieldId: createId(),
              ...field,
            }), // override id to prohibit db errors
        );

        const _form = createForm({...form, formFields, tenantId, jobId});
        const params = formsMapper.toPersistance(_form);

        return db.forms.create(params);
      }),
    );
  };

  const importJob = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    return new Promise((resolve, reject) => {
      const formidable = new IncomingForm();
      formidable.parse(req, async (error, fields, files) => {
        try {
          if (error) return reject(new BaseError(500, error));
          const file = _validateJobFile(files.job);
          const json = await _readJSONFile(file);
          const {forms: jsonForms, ...jsonJob} = json;

          const job = await _insertJSONJob(tenantId, json);

          // split forms into replicas and primaries
          type FormsMap = {primaries: DBForm[]; replicas: DBForm[]};
          const formsMap = (jsonForms as DBForm[]).reduce(
            (acc, curr) => {
              if (!curr.replicaOf) acc.primaries.push(curr);
              else acc.replicas.push(curr);
              return acc;
            },
            {primaries: [], replicas: []} as FormsMap,
          );

          // insert forms
          let primaries = await _insertForms(
            tenantId,
            job.id,
            formsMap.primaries,
          );
          let replicas = await _insertForms(
            tenantId,
            job.id,
            formsMap.replicas,
          );

          const forms = primaries.concat(replicas);

          const body = {
            ...jobsMapper.toDTO(tenantId, job),
            forms: forms.map((form) => formsMapper.toDTO(form)),
          };
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
