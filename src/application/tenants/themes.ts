import {IncomingForm} from 'formidable';
import {BaseError, httpReqHandler} from 'application/errorHandling';
import fs from 'fs';
import {S3} from 'aws-sdk';
import db from 'infrastructure/db';

export const ThemesAdapter = () => {
  const upload = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const formidable = new IncomingForm();
    return new Promise((resolve, reject) => {
      formidable.parse(req, async (error, fields, files) => {
        if (error) return reject(new BaseError(500, error));
        const file = files.theme;
        if (Array.isArray(file))
          return reject(new BaseError(422, 'Multifile no supported.'));
        const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
        if (extension !== 'css')
          return reject(new BaseError(422, `Invalid fileformat ${extension}`));

        const tenant = await db.tenants.retrieve(tenantId);
        if (!tenant) throw new BaseError(404, 'Tenant Not Found');

        const s3 = new S3();
        const bucket = process.env.S3_BUCKET!;

        const fileId = (Math.random() * 1e32).toString(36);
        const fileKey = tenant.theme || tenantId + '.' + fileId + '.css';
        const fileStream = fs.createReadStream(file.path);

        const params = {
          Key: fileKey,
          Bucket: bucket,
          ContentType: file.type,
          Body: fileStream,
        };
        await s3.upload(params).promise();

        if (!tenant.theme) await db.tenants.updateTheme(tenantId, fileKey);

        resolve({
          status: 201,
          body: {message: 'Successfully uploaded theme'},
        });
      });
    });
  });

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (!tenant.theme) throw new BaseError(404, 'Theme Not Found');

    const s3 = new S3();
    const bucket = process.env.S3_BUCKET!;
    const delParams = {
      Bucket: bucket,
      Delete: {Objects: [{Key: tenant.theme!}]},
    };
    await s3.deleteObjects(delParams).promise();
    await db.tenants.updateTheme(tenantId, null);
    return {};
  });

  return {upload, del};
};
