import {IncomingForm} from 'formidable';
import {BaseError, httpReqHandler} from 'adapters/errorHandling';
import {ThemesService} from 'domain/services/tenants/themes';

export const ThemesAdapter = () => {
  const themes = ThemesService();
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

        await themes.upload(tenantId, file);

        resolve({
          status: 201,
          body: {message: 'Successfully uploaded theme'},
        });
      });
    });
  });

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    await themes.del(tenantId);
    return {};
  });

  return {upload, del};
};
