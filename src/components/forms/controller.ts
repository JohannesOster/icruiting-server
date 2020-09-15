import fs from 'fs';
import {IncomingForm} from 'formidable';
import {S3} from 'aws-sdk';
import {dbInsertApplicant} from 'components/applicants';
import {catchAsync, BaseError} from 'errorHandling';
import {
  dbInsertForm,
  dbSelectForms,
  dbSelectForm,
  dbDeleteForm,
  dbUpdateForm,
} from './database';
import {TForm} from './types';

export const createForm = catchAsync(async (req, res) => {
  const orgId = res.locals.user.orgID;
  const params: TForm = {...req.body, organization_id: orgId};
  const resp = await dbInsertForm(params);
  res.status(201).json(resp);
});

export const getForms = catchAsync(async (req, res) => {
  const orgId = res.locals.user.orgID;
  const job_id = req.query.job_id as string;
  const resp = await dbSelectForms(orgId, job_id);
  res.status(200).json(resp);
});

export const renderHTMLForm = catchAsync(async (req, res) => {
  const {form_id} = req.params;
  const forms = await dbSelectForm(form_id);
  if (!forms.length) throw new BaseError(404, 'Not Found');

  const form = forms[0];
  const currUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.header('Content-Type', 'text/html');
  res.render('form', {
    formID: form.form_id,
    formItems: form.form_fields,
    submitAction: currUrl,
  });
});

export const submitHTMLForm = catchAsync(async (req, res) => {
  const {form_id} = req.params;
  const forms = await dbSelectForm(form_id);
  if (!forms.length) throw new BaseError(404, 'Not Found');
  const form: TForm = forms[0];

  if (form.form_category !== 'application') {
    throw new BaseError(
      402,
      'Only application form are allowed to be submitted via html',
    );
  }

  // base object with required foreign keys
  const applicant: any = {
    organization_id: form.organization_id,
    job_id: form.job_id,
  };

  const formidable = new IncomingForm({multiples: true} as any);
  formidable.parse(req, (err: Error, fields: any, files: any) => {
    if (err) throw new BaseError(402, err.message);

    const s3 = new S3();
    const promises = [];

    const map = form.form_fields.reduce(
      (acc, item) => {
        if (!item.form_field_id) {
          throw new BaseError(
            500,
            'Received database entry without primary key',
          );
        }

        // !> filter out non submitted values
        if (
          !fields[item.form_field_id] &&
          (!files[item.form_field_id] || !files[item.form_field_id].size)
        ) {
          if (item.required)
            throw new BaseError(402, `Missing required field: ${item.label}`);
          return acc;
        }

        if (['input', 'textarea', 'date_picker'].includes(item.component)) {
          console.log(`Got ${item.component}, no mapping required.`);

          acc.attributes.push({
            key: item.label,
            value: fields[item.form_field_id],
          });
        } else if (['select', 'radio'].includes(item.component)) {
          console.log(`Got ${item.component}, map value to label of option.`);
          // find the one option where option.value is equal to submitted value value
          const val = fields[item.form_field_id];
          const options = item.options?.filter(
            (option: any) => option.value === val,
          );

          // throw error if submitted value does not exists in formitem options
          if (!options?.length)
            throw new BaseError(402, `Invalid selection: ${item.label}`);

          acc.attributes.push({
            key: item.label,
            value: options[0].label,
          });
        } else if (item.component === 'checkbox') {
          console.log(
            `Got ${item.component} join selected values by comma (,).`,
          );

          const value = Array.isArray(fields[item.form_field_id])
            ? fields[item.form_field_id].join(', ')
            : fields[item.form_field_id];

          console.log(fields[item.form_field_id], {
            key: item.label,
            value: value,
          });

          acc.attributes.push({
            key: item.label,
            value: value,
          });
        } else if (item.component === 'file_upload') {
          console.log(
            `Got ${item.component}. Upload file to S3 bucket and map value to {label, fileURL}`,
          );

          const file = files[item.form_field_id];
          const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
          const fileId = (Math.random() * 1e32).toString(36);
          const fileKey = form.organization_id + '.' + fileId + '.' + extension;
          const fileStream = fs.createReadStream(file.path);
          const params = {
            Key: fileKey,
            Bucket: process.env.S3_BUCKET || '',
            ContentType: 'application/pdf',
            Body: fileStream,
          };

          fs.unlink(file.path, function (err) {
            if (err) console.error(err);
            console.log('Temp File Delete');
          });

          promises.push(s3.upload(params).promise());
          acc.files.push({key: item.label, value: fileKey});
        }

        return acc;
      },
      {attributes: [], files: []} as any,
    );

    applicant.files = !!map.files && map.files;
    applicant.attributes = !!map.attributes && map.attributes;

    promises.push(dbInsertApplicant(applicant));

    Promise.all(promises)
      .then(() => {
        res.header('Content-Type', 'text/html');
        res.render('form-submission', {});
      })
      .catch((err) => {
        res.header('Content-Type', 'text/html');
        res.render('form-submission', {error: err});
      });
  });
});

export const deleteForm = catchAsync(async (req, res) => {
  const {form_id} = req.params;
  await dbDeleteForm(form_id);
  res.status(200).json({});
});

export const updateForm = catchAsync(async (req, res) => {
  const {form_id} = req.params;
  const {orgID} = res.locals.user;

  const params = {...req.body, organization_id: orgID};

  const resp = await dbUpdateForm(form_id, params);
  res.status(200).json(resp);
});
