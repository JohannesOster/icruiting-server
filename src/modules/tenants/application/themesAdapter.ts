import fs from 'fs';
import {IncomingForm} from 'formidable';
import {httpReqHandler} from 'shared/infrastructure/http';
import {BaseError} from 'application';
import storageService from 'infrastructure/storageService';
import {DB} from '../infrastructure/repositories';

export const ThemesAdapter = (db: DB) => {
  const upload = httpReqHandler((req) => {
    const {tenantId} = req.user;

    return new Promise((resolve, reject) => {
      const formidable = new IncomingForm();
      formidable.parse(req, async (error, fields, files) => {
        try {
          if (error) throw new BaseError(500, error);

          const file = files.theme;
          if (!file) throw new BaseError(422, 'Theme is missing.');

          if (Array.isArray(file))
            throw new BaseError(422, 'Multifile no supported.');

          if (!file.name) throw new BaseError(500, 'File has no name');
          if (!file.type) throw new BaseError(500, 'File has no type');

          const extension = file.name.substring(file.name.lastIndexOf('.') + 1);
          if (extension !== 'css')
            throw new BaseError(422, `Invalid fileformat ${extension}`);

          const tenant = await db.tenants.retrieve(tenantId);
          if (!tenant) throw new BaseError(404, 'Tenant Not Found');

          const fileId = (Math.random() * 1e32).toString(36);
          const fileKey = tenant.theme || tenantId + '.' + fileId + '.css';
          const fileStream = fs.createReadStream(file.path);

          const params = {
            path: fileKey,
            contentType: file.type,
            data: fileStream,
          };
          await storageService.upload(params);

          if (!tenant.theme) await db.tenants.updateTheme(tenantId, fileKey);

          resolve({
            status: 201,
            body: {message: 'Successfully uploaded theme'},
          });
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
