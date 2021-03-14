import fs from 'fs';
import {IncomingForm} from 'formidable';
import db from 'infrastructure/db';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';
import {BaseError} from 'application/errorHandling';
import storageService from 'infrastructure/storageService';

export const ThemesAdapter = () => {
  const upload = httpReqHandler((req) => {
    const {tenantId} = req.user;

    return new Promise((resolve, reject) => {
      const formidable = new IncomingForm();
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

        resolve({status: 201, body: {message: 'Successfully uploaded theme'}});
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
