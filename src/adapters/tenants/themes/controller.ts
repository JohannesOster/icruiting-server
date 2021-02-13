import fs from 'fs';
import {IncomingForm} from 'formidable';
import {S3} from 'aws-sdk';
import db from 'infrastructure/db';
import {BaseError, catchAsync} from 'adapters/errorHandling';

export const upload = catchAsync(async (req, res, next) => {
  const {tenantId} = req.user;

  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;

  const formidable = new IncomingForm();
  formidable.parse(req, async (error, fields, files) => {
    try {
      if (error) throw new BaseError(500, error);

      const file = files.theme;
      if (Array.isArray(file))
        throw new BaseError(422, 'Multifile no supported.');
      const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
      if (extension !== 'css')
        throw new BaseError(422, `Invalid fileformat ${extension}`);
      const fileId = (Math.random() * 1e32).toString(36);
      const fileKey = tenant.theme || tenantId + '.' + fileId + '.' + extension;
      const fileStream = fs.createReadStream(file.path);

      const params = {
        Key: fileKey,
        Bucket: bucket,
        ContentType: file.type,
        Body: fileStream,
      };
      await s3.upload(params).promise();

      if (!tenant.theme) await db.tenants.updateTheme(tenantId, fileKey);

      res.status(201).json({message: 'Successfully uploaded theme'});
    } catch (error) {
      next(error);
    }
  });
});

export const del = catchAsync(async (req, res) => {
  const {tenantId} = req.user;

  const tenant = await db.tenants.retrieve(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.theme) throw new BaseError(404, 'Theme Not Found');

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;
  const delParams = {Bucket: bucket, Delete: {Objects: [{Key: tenant.theme!}]}};
  await s3.deleteObjects(delParams).promise();
  await db.tenants.updateTheme(tenantId, null);

  res.status(200).json();
});
