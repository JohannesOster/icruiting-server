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
  const {tenant_id} = res.locals.user;
  const params = {...req.body, tenant_id};
  const resp = await dbInsertForm(params);
  res.status(201).json(resp);
});

export const getForms = catchAsync(async (req, res) => {
  const {tenant_id} = res.locals.user;
  const job_id = req.query.job_id as string;
  const resp = await dbSelectForms(tenant_id, job_id);
  res.status(200).json(resp);
});

export const renderHTMLForm = catchAsync(async (req, res) => {
  const {form_id} = req.params;
  const form: TForm | undefined = await dbSelectForm(form_id);
  if (!form) throw new BaseError(404, 'Not Found');

  const {protocol, originalUrl} = req;
  const host = req.get('host');
  const submitAction = `${protocol}://${host}${originalUrl}`;
  const params = {formId: form_id, formFields: form.form_fields, submitAction};

  res.header('Content-Type', 'text/html');
  res.render('form', params);
});

export const submitHTMLForm = catchAsync(async (req, res) => {
  const {form_id} = req.params;
  const form: TForm | undefined = await dbSelectForm(form_id);
  if (!form) throw new BaseError(404, 'Not Found');

  if (form.form_category !== 'application') {
    throw new BaseError(
      402,
      'Only application form are allowed to be submitted via html',
    );
  }

  const applicant: any = {
    tenant_id: form.tenant_id,
    job_id: form.job_id,
  };

  const formidable = new IncomingForm();
  formidable.parse(req, (err: Error, fields: any, files: any) => {
    if (err) throw new BaseError(500, err.message);

    const s3 = new S3();
    const promises = [];

    const map = form.form_fields.reduce(
      (acc, item) => {
        // !> filter out non submitted values
        const fieldExists = fields[item.form_field_id];
        const file = files[item.form_field_id];
        const fileExists = file && file.size;
        if (!fieldExists && !fileExists) {
          if (item.required)
            throw new BaseError(402, `Missing required field: ${item.label}`);
          return acc;
        }

        if (
          ['input', 'textarea', 'date_picker', 'select', 'radio'].includes(
            item.component,
          )
        ) {
          console.log(`Got ${item.component}, no mapping required.`);

          acc.attributes.push({
            form_field_id: item.form_field_id,
            attribute_value: fields[item.form_field_id],
          });
        } else if (item.component === 'checkbox') {
          console.log(
            `Got ${item.component} join selected values by comma (,).`,
          );

          const value = Array.isArray(fields[item.form_field_id])
            ? fields[item.form_field_id].join(', ')
            : fields[item.form_field_id];

          acc.attributes.push({
            form_field_id: item.form_field_id,
            attribute_value: value,
          });
        } else if (item.component === 'file_upload') {
          console.log(
            `Got ${item.component}. Upload file to S3 bucket and map value to {label, fileURL}`,
          );

          const file = files[item.form_field_id];
          const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
          const fileType =
            extension === 'pdf' ? 'application/pdf' : 'image/jpeg';
          const fileId = (Math.random() * 1e32).toString(36);
          const fileKey = form.tenant_id + '.' + fileId + '.' + extension;
          const fileStream = fs.createReadStream(file.path);
          const params = {
            Key: fileKey,
            Bucket: process.env.S3_BUCKET || '',
            ContentType: fileType,
            Body: fileStream,
          };

          fs.unlink(file.path, function (err) {
            if (err) console.error(err);
            console.log('Temp File Delete');
          });

          promises.push(s3.upload(params).promise());
          acc.attributes.push({
            form_field_id: item.form_field_id,
            attribute_value: fileKey,
          });
        }

        return acc;
      },
      {attributes: []} as any,
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
  const {tenant_id} = res.locals.user;
  const params = {...req.body, tenant_id};
  const resp = await dbUpdateForm(form_id, params);
  res.status(200).json(resp);
});
