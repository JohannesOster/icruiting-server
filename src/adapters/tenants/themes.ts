import {IncomingForm} from 'formidable';
import {BaseError, catchAsync} from 'adapters/errorHandling';
import {ThemesService} from 'domain/services/tenants/themes';

export const ThemesAdapter = () => {
  const themes = ThemesService();
  const upload = catchAsync(async (req, res, next) => {
    const {tenantId} = req.user;
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

        await themes.upload(tenantId, file);

        res.status(201).json({message: 'Successfully uploaded theme'});
      } catch (error) {
        next(error);
      }
    });
  });

  const del = catchAsync(async (req, res) => {
    const {tenantId} = req.user;
    await themes.del(tenantId);
    res.status(200).json();
  });

  return {upload, del};
};
