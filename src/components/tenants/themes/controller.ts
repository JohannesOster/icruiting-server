import fs from 'fs';
import {IncomingForm} from 'formidable';
import {S3} from 'aws-sdk';
import db from 'db';
import {BaseError, catchAsync} from 'errorHandling';

export const create = catchAsync(async (req, res, next) => {
  const {tenantId} = req.user;

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;

  const formidable = new IncomingForm();
  formidable.parse(req, async (error, fields, files) => {
    try {
      if (error) throw new BaseError(500, error);

      const file = files.theme;
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

      res.status(201).json({message: 'Successfully updated theme'});
    } catch (error) {
      next(error);
    }
  });
});

export const del = catchAsync(async (req, res) => {
  const {tenantId} = req.user;

  const tenant = await db.tenants.find(tenantId);
  if (!tenant) throw new BaseError(404, 'Tenant Not Found');
  if (!tenant.theme) throw new BaseError(404, 'Theme Not Found');

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;
  const delParams = {Bucket: bucket, Delete: {Objects: [{Key: tenant.theme!}]}};
  await s3.deleteObjects(delParams).promise();
  await db.tenants.updateTheme(tenantId, null);

  res.status(200).json();
});
