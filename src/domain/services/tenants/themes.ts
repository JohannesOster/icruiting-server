import {File} from 'formidable';
import {BaseError} from 'adapters/errorHandling';
import fs from 'fs';
import {S3} from 'aws-sdk';
import db from 'infrastructure/db';

export const ThemesService = () => {
  const upload = async (tenantId: string, theme: File) => {
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');

    const s3 = new S3();
    const bucket = process.env.S3_BUCKET!;

    const fileId = (Math.random() * 1e32).toString(36);
    const fileKey = tenant.theme || tenantId + '.' + fileId + '.css';
    const fileStream = fs.createReadStream(theme.path);

    const params = {
      Key: fileKey,
      Bucket: bucket,
      ContentType: theme.type,
      Body: fileStream,
    };
    await s3.upload(params).promise();

    if (!tenant.theme) await db.tenants.updateTheme(tenantId, fileKey);
  };

  const del = async (tenantId: string) => {
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
  };

  return {upload, del};
};
