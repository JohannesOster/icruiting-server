import fs from 'fs';
import storageService from 'infrastructure/storageService';
import {BaseError} from 'application';
import formidable, {File} from 'formidable';
import {httpReqHandler} from 'shared/infrastructure/http';
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
    const {jobTitle} = req.body;
    const {tenantId} = req.user;

    const job = createJob({jobTitle, jobRequirements: []});
    const params = jobsMapper.toPersistance(tenantId, job);
    const raw = await db.jobs.create(params);
    const body = jobsMapper.toDTO(tenantId, raw);

    return {status: 201, body};
  });

  const update = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;

    const jobRequirements = (req.body.jobRequirements || []).map((req: any) => {
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
    return db.jobs.createReport(tenantId, jobId, req.body).then((body) => ({status: 201, body}));
  });

  const retrieveReport = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    return db.jobs.retrieveReport(tenantId, jobId).then((body) => ({body}));
  });

  const updateReport = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId} = req.params;
    return await db.jobs.updateReport(tenantId, jobId, req.body).then((body) => ({body}));
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

  const _validateJobFile = (file: File[] | undefined) => {
    if (!file) throw new BaseError(422, 'Missing file');
    if (!file[0]) throw new BaseError(422, 'Missing file');
    if (!file[0].originalFilename) throw new BaseError(500, 'Missing file name');

    const extension = file[0].originalFilename.substr(
      file[0].originalFilename.lastIndexOf('.') + 1,
    );
    if (extension !== 'json') throw new BaseError(422, `Invalid fileformat ${extension}`);

    return file[0];
  };

  const _readJSONFile = async (file: File) => {
    const data = await new Promise<Buffer>((resolve, reject) => {
      fs.readFile(file.filepath, (error, data) => {
        if (error) return reject(new BaseError(500, error.message));
        resolve(data);
      });
    });

    return JSON.parse(data.toString());
  };

  const _insertJSONJob = async (tenantId: string, params: DBJob) => {
    const {jobRequirements: _jobRequirements, ..._job} = params;

    const idMap: {[key: string]: string} = {}; // map old Ids to new ones

    const jobRequirements = _jobRequirements.map((req) => {
      const jobRequirement = createJobRequirement(req);
      idMap[req.jobRequirementId] = jobRequirement.id;
      return jobRequirement;
    });

    const job = createJob({..._job, jobRequirements});

    const dbJob = await db.jobs.create(jobsMapper.toPersistance(tenantId, job));

    return [dbJob, idMap] as const;
  };

  const _insertForms = async (
    tenantId: string,
    jobId: string,
    forms: DBForm[],
    jobRequirementsIdMap: {[key: string]: string},
    formsIdMap: {[key: string]: string},
  ) => {
    return [
      await Promise.all(
        forms.map(({formFields: _formFields, ...form}) => {
          const formFields = _formFields.map(({formFieldId, jobRequirementId = '', ...field}) => {
            const jobReqId = jobRequirementsIdMap[jobRequirementId || ''];

            const params = {
              formFieldId: createId(), // override id to prohibit db errors
              ...(jobReqId ? {jobRequirementId: jobReqId} : {}),
              ...field,
            };

            return formFieldsMapper.toDomain(params);
          });

          const replicaOf = form.replicaOf ? {replicaOf: formsIdMap[form.replicaOf || '']} : {};

          const _form = createForm({
            ...form,
            ...replicaOf,
            formFields,
            tenantId,
            jobId,
          });

          formsIdMap[form.formId] = _form.id;

          const params = formsMapper.toPersistance(_form);

          return db.forms.create(params);
        }),
      ),
      formsIdMap,
    ] as const;
  };

  const importJob = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    return new Promise((resolve, reject) => {
      formidable().parse(req, async (error, fields, files) => {
        try {
          if (error) return reject(new BaseError(500, error));
          const file = _validateJobFile(files.job);
          const json = await _readJSONFile(file);
          const {forms: jsonForms, ...jsonJob} = json;

          const [job, jobRequirementsIdMap] = await _insertJSONJob(tenantId, jsonJob);

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
          let [primaries, formsIdMap] = await _insertForms(
            tenantId,
            job.id,
            formsMap.primaries,
            jobRequirementsIdMap,
            {},
          );
          let [replicas, _formsIdMap] = await _insertForms(
            tenantId,
            job.id,
            formsMap.replicas,
            jobRequirementsIdMap,
            formsIdMap,
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
