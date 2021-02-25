import db from 'infrastructure/db';
import storageService from 'infrastructure/storageService';
import {BaseError, httpReqHandler} from 'application/errorHandling';
import {createJob} from 'domain/entities';

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
    const job = db.jobs.retrieve(tenantId, jobId);
    if (!job) throw new BaseError(404, 'Not Found');

    return {file: {name: 'form.json', data: job}};
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
  };
};
