import {S3} from 'aws-sdk';
import {BaseError, httpReqHandler} from 'adapters/errorHandling';
import db from 'infrastructure/db';

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
    const resp = await db.jobs.create(params);
    return {status: 201, body: resp};
  });

  const update = httpReqHandler(async (req) => {
    const {jobId} = req.params;
    const {tenantId} = req.user;
    const resp = await db.jobs.update(tenantId, {...req.body, jobId});
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
      const keys = files?.map(({value}) => value);
      return acc.concat(keys);
    }, [] as string[]);

    if (fileKeys.length) {
      const s3 = new S3();
      const bucket = process.env.S3_BUCKET || '';
      const keys = fileKeys.map((key) => ({Key: key}));
      const delParams = {Bucket: bucket, Delete: {Objects: keys}};
      await s3.deleteObjects(delParams).promise();
    }

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
