import fs from 'fs';
import formidable from 'formidable';
import {httpReqHandler} from 'shared/infrastructure/http';
import {BaseError} from 'application';
import storageService from 'shared/infrastructure/services/storageService';
import {DB} from '../infrastructure/repositories';

export const ThemesAdapter = (db: DB) => {
  const upload = httpReqHandler((req) => {
    const {tenantId} = req.user;

    return new Promise((resolve, reject) => {
      formidable().parse(req, async (error, fields, files) => {
        try {
          if (error) throw new BaseError(500, error);

          const file = files.theme?.shift();
          if (!file) throw new BaseError(422, 'Theme is missing.');

          if (!file.originalFilename) throw new BaseError(500, 'File has no name');
          if (!file.mimetype) throw new BaseError(500, 'File has no type');

          const extension = file.originalFilename.substring(
            file.originalFilename.lastIndexOf('.') + 1,
          );
          if (extension !== 'css') throw new BaseError(422, `Invalid fileformat ${extension}`);

          const tenant = await db.tenants.retrieve(tenantId);
          if (!tenant) throw new BaseError(404, 'Tenant Not Found');

          const fileId = (Math.random() * 1e32).toString(36);
          const fileKey = tenant.theme || tenantId + '.' + fileId + '.css';
          const fileStream = fs.createReadStream(file.filepath);

          const params = {path: fileKey, contentType: file.mimetype, data: fileStream};
          await storageService.upload(params);

          if (!tenant.theme) await db.tenants.updateTheme(tenantId, fileKey);

          resolve({status: 201, body: {message: 'Successfully uploaded theme'}});
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const tenant = await db.tenants.retrieve(tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');
    if (!tenant.theme) throw new BaseError(404, 'Theme Not Found');

    await storageService.del(tenant.theme);
    await db.tenants.updateTheme(tenantId, null);
    return {};
  });

  return {upload, del};
};
