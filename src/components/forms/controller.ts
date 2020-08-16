import {RequestHandler} from 'express';
import {IncomingForm} from 'formidable';
import {S3} from 'aws-sdk';
import fs from 'fs';
import {dbInsertApplicant} from 'components/applicants';
import {
  dbInsertForm,
  dbSelectForms,
  dbSelectForm,
  dbDeleteForm,
  dbUpdateForm,
} from './database';
import {TForm} from './types';

export const createForm: RequestHandler = (req, res, next) => {
  const orgId = res.locals.user.orgID;
  const params: TForm = {...req.body, organization_id: orgId};
  dbInsertForm(params)
    .then((data) => res.status(201).json(data))
    .catch(next);
};

export const getForms: RequestHandler = (req, res, next) => {
  const orgId = res.locals.user.orgID;
  dbSelectForms(orgId)
    .then((forms) => res.status(200).json(forms))
    .catch(next);
};

export const renderHTMLForm: RequestHandler = (req, res, next) => {
  const {form_id} = req.params;
  dbSelectForm(form_id)
    .then((result) => {
      if (!result.length) return res.sendStatus(404);
      const form = result[0];
      const currUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      res.header('Content-Type', 'text/html');
      res.render('form', {
        formID: form.form_id,
        formItems: form.form_items,
        submitAction: currUrl,
      });
    })
    .catch(next);
};

export const submitHTMLForm: RequestHandler = (req, res, next) => {
  const {form_id} = req.params;
  dbSelectForm(form_id).then((result) => {
    if (!result.length) return res.sendStatus(404);
    const form = result[0];

    if (form.form_category !== 'application') {
      return res.status(402).json({
        message: 'Only application form are allowed to be submitted via html',
      });
    }

    // base object with required foreign keys
    const applicant: any = {
      organization_id: form.organization_id,
      job_id: form.job_id,
    };

    const formidable = new IncomingForm({multiples: true} as any);
    formidable.parse(req, (err: any, fields: any, files: any) => {
      if (err) return next(err);

      const s3 = new S3();
      const promises = [];

      const map = form.form_items.reduce(
        (acc: any, item: any) => {
          // !> filter out non submitted values
          if (
            !fields[item.form_item_id] &&
            (!files[item.form_item_id] || !files[item.form_item_id].size)
          ) {
            if (item.validation && item.validation.required)
              throw new Error('Missing required field');
            return acc;
          }

          if (['input', 'textarea'].includes(item.component)) {
            console.log(`Got ${item.component}, no mapping required.`);

            acc.attributes.push({
              key: item.label,
              value: fields[item.form_item_id],
            });
          } else if (['select', 'radio'].includes(item.component)) {
            console.log(`Got ${item.component}, map value to label of option.`);
            // find the one option where option.value is equal to submitted value value
            const val = fields[item.form_item_id];
            const options = item.options.filter(
              (option: any) => option.value === val,
            );

            // throw error if submitted value does not exists in formitem options
            if (!options.length) throw new Error('Invalid submission.');

            acc.attributes.push({
              key: item.label,
              value: options[0].label,
            });
          } else if (item.component === 'file_upload') {
            console.log(
              `Got ${item.component}. Upload file to S3 bucket and map value to {label, fileURL}`,
            );

            const file = files[item.form_item_id];
            const extension = file.name.substr(file.name.lastIndexOf('.') + 1);
            const fileId = (Math.random() * 1e32).toString(36);
            const fileKey =
              form.organization_id + '.' + fileId + '.' + extension;
            const params: any = {
              Key: 'applications/' + fileKey,
              Bucket: process.env.S3_BUCKET || '',
              ContentType: 'application/pdf',
            };

            const fileStream = fs.createReadStream(file.path);
            fileStream.on('error', function (err) {
              console.log('File Error', err);
            });
            params.Body = fileStream;
            fs.unlink(file.path, function (err) {
              if (err) console.error(err);
              console.log('Temp File Delete');
            });

            promises.push(s3.upload(params).promise());
            acc.files.push({key: item.label, value: fileKey});
          }

          return acc;
        },
        {attributes: [], files: []},
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
};

export const deleteForm: RequestHandler = (req, res, next) => {
  const {form_id} = req.params;
  dbDeleteForm(form_id)
    .then(() => res.status(200).json({}))
    .catch(next);
};

export const updateForm: RequestHandler = (req, res, next) => {
  const {form_id} = req.params;
  dbUpdateForm(form_id, req.body)
    .then((result) => res.status(200).json(result))
    .catch(next);
};
