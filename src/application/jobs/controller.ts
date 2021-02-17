import {BaseError, httpReqHandler} from 'application/errorHandling';
import db from 'infrastructure/db';
import {createJob} from 'domain/entities';
import storageService from 'infrastructure/storageService';

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
    const params = {jobTitle, tenantId, jobRequirements};
    const resp = await db.jobs.create(createJob(params));
    return {status: 201, body: resp};
  });

  const update = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;
    const resp = await db.jobs.update(
      createJob({...req.body, jobId, tenantId}),
    );
    return {body: resp};
  });

  const del = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId, userId} = req.user;

    const {applicants} = await db.applicants.list({
      tenantId,
      jobId,
      userId,
    });

    const fileKeys = applicants.reduce((acc, {files}) => {
      if (!files) return acc;
      const keys = files?.map(({uri}) => uri);
      return acc.concat(keys);
    }, [] as string[]);

    if (fileKeys.length) await storageService.bulkDel(fileKeys);

    await db.jobs.del(tenantId, jobId);

    return {};
  });

  const list = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const resp = await db.jobs.list(tenantId);
    return {body: resp};
  });

  return {create, retrieve, update, del, list};
};