import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {insertForm, selectForms, selectForm} from '../../db/forms.db';
import {insertApplicant} from '../../db/applicants.db';
import {IncomingForm} from 'formidable';
import {S3} from 'aws-sdk';
import fs from 'fs';

export const createForm: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  insertForm({...req.body, organization_id: res.locals.user.orgID})
    .then((data) => {
      res.status(201).json(data);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
};

export const getForms: RequestHandler = (req, res, next) => {
  selectForms(res.locals.user.orgID)
    .then((forms) => {
      res.status(200).json(forms);
    })
    .catch((err) => {
      console.log(err);

      next(err);
    });
};

export const renderHTMLForm: RequestHandler = (req, res, next) => {
  selectForm(req.params.form_id)
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
  selectForm(req.params.form_id).then((result) => {
    if (!result.length) return res.sendStatus(404);
    const form = result[0];

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

          if (['Input', 'Textarea'].includes(item.component)) {
            console.log(`Got ${item.component}, no mapping required.`);

            acc.attributes.push({
              name: item.label,
              value: fields[item.form_item_id],
            });
          } else if (['Select', 'Radio'].includes(item.component)) {
            console.log(`Got ${item.component}, map value to label of option.`);
            // find the one option where option.value is equal to submitted value value
            const val = fields[item.form_item_id];
            const options = item.options.filter(
              (option: any) => option.value === val,
            );

            // throw error if submitted value does not exists in formitem options
            if (!options.length) throw new Error('Invalid submission.');

            acc.attributes.push({
              name: item.label,
              value: options[0].label,
            });
          } else if (item.component === 'FileUpload') {
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
            acc.files.push({name: item.label, value: fileKey});
          }

          return acc;
        },
        {attributes: [], files: []},
      );

      applicant.files = map.files && JSON.stringify(map.files);
      applicant.attributes = map.attributes && JSON.stringify(map.attributes);

      promises.push(insertApplicant(applicant));

      Promise.all(promises)
        .then((data) => {
          console.log(data);
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

export const submitForm: RequestHandler = async (req, res, next) => {
  selectForm(req.params.form_id)
    .then((result) => {
      if (!result.length) return res.sendStatus(404);
      const form = result[0];
      const submitterId = res.locals.user['sub'];
      try {
        if (form.form_category === 'SCREENING')
          submitScreening(form, submitterId, req.body);
      } catch (error) {
        next(error);
      }

      res.json({});
    })
    .catch(next);
};

const submitScreening = async (form: any, submitterId: string, body: any) => {
  console.log(
    `Submit screening form ${JSON.stringify(
      form,
    )}. Submitted by ${submitterId} with req body ${JSON.stringify(body)}`,
  );
};
