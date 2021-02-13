import fs from 'fs';
import {IncomingForm} from 'formidable';
import {S3} from 'aws-sdk';
import {catchAsync, BaseError} from 'errorHandling';
import db from 'infrastructure/db';
import config from 'config';
import {validateSubscription} from './utils';

export const create = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const params = {...req.body, tenantId};
  const resp = await db.forms.create(params);
  res.status(201).json(resp);
});

export const retrieve = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const {formId} = req.params;
  const resp = await db.forms.retrieve(tenantId, formId);
  if (!resp) throw new BaseError(404, 'Not Found');
  res.status(200).json(resp);
});

export const update = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const params = {...req.body, tenantId};
  const resp = await db.forms.update(params);
  res.status(200).json(resp);
});

export const del = catchAsync(async (req, res) => {
  const {formId} = req.params;
  const {tenantId} = req.user;
  await db.forms.del(tenantId, formId);
  res.status(200).json();
});

export const list = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const jobId = req.query.jobId as string;
  const resp = await db.forms.list(tenantId, jobId);
  res.status(200).json(resp);
});

export const exportForm = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const {formId} = req.params;
  const form: any = await db.forms.retrieve(tenantId, formId); // has to be any in order to delete props
  if (!form) throw new BaseError(404, 'Not Found');

  // remove unnecessary ids
  delete form.tenantId;
  delete form.formId;
  delete form.jobId;
  delete form.createdAt;
  form.formFields.forEach((field: any) => {
    delete field.formId;
    delete field.formFieldId;
    delete field.jobRequirementId;
  });

  res.attachment('form.json').send(form);
});

export const renderHTMLForm = catchAsync(async (req, res) => {
  const {formId} = req.params;
  const form = await db.forms.retrieve(null, formId);
  if (!form) throw new BaseError(404, 'Not Found');

  try {
    await validateSubscription(form.tenantId);
  } catch (error) {
    return res.render('form', {error: error.message});
  }
  const submitAction = config.baseURL + req.originalUrl;
  let params: any = {formId, submitAction, formFields: form.formFields};
  const tenant = await db.tenants.retrieve(form.tenantId);

  if (tenant?.theme) {
    const urlParams = {
      Bucket: process.env.S3_BUCKET,
      Key: tenant.theme,
      Expires: 100,
    };
    const url = await new S3().getSignedUrlPromise('getObject', urlParams);
    params = {...params, theme: url};
  }

  res.render('form', params);
});

export const submitHTMLForm = catchAsync(async (req, res) => {
  const {formId} = req.params;
  const form = await db.forms.retrieve(null, formId);
  if (!form) throw new BaseError(404, 'Not Found');

  try {
    await validateSubscription(form.tenantId);
  } catch (error) {
    res.render('submission', {error});
  }

  if (form.formCategory !== 'application') {
    const errorMsg =
      'Only application form are allowed to be submitted via html';
    throw new BaseError(402, errorMsg);
  }

  const applicant: any = {tenantId: form.tenantId, jobId: form.jobId};

  const formidable = new IncomingForm();
  formidable.maxFileSize = 500 * 1024 * 1024;
  formidable.parse(req, (error: Error, fields: any, files: any) => {
    if (error) return res.render('form-submission', {error});

    const s3 = new S3();
    const promises = [];

    const map = form.formFields.reduce(
      (acc, item) => {
        // !> filter out non submitted values
        const fieldExists = fields[item.formFieldId];
        const file = files[item.formFieldId];
        const fileExists = file && file.size;
        if (!fieldExists && !fileExists) {
          if (item.required)
            throw new BaseError(402, `Missing required field: ${item.label}`);
          return acc;
        }

        if (['input', 'textarea', 'select', 'radio'].includes(item.component)) {
          acc.attributes.push({
            formFieldId: item.formFieldId,
            attributeValue: fields[item.formFieldId],
          });
        } else if (item.component === 'checkbox') {
          const value = Array.isArray(fields[item.formFieldId])
            ? fields[item.formFieldId].join(', ')
            : fields[item.formFieldId];

          acc.attributes.push({
            formFieldId: item.formFieldId,
            attributeValue: value,
          });
        } else if (item.component === 'file_upload') {
          const file = files[item.formFieldId];
          const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
          const fileId = (Math.random() * 1e32).toString(36);
          const fileKey = form.tenantId + '.' + fileId + '.' + extension;
          const fileStream = fs.createReadStream(file.path);
          const params = {
            Key: fileKey,
            Bucket: process.env.S3_BUCKET || '',
            ContentType: file.type,
            Body: fileStream,
          };

          fs.unlink(file.path, console.error);

          promises.push(s3.upload(params).promise());
          acc.attributes.push({
            formFieldId: item.formFieldId,
            attributeValue: fileKey,
          });
        }

        return acc;
      },
      {attributes: []} as {
        attributes: {formFieldId: string; attributeValue: string}[];
      },
    );

    applicant.attributes = map.attributes;
    promises.push(db.applicants.create(applicant));

    Promise.all(promises)
      .then(() => res.render('form-submission'))
      .catch((error) => {
        res.render('form-submission', {error});
      });
  });
});
