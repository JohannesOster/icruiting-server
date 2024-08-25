import fs from 'fs';
import formidable from 'formidable';
import {v4 as uuid} from 'uuid';
import {DB} from '../infrastructure/db';
import {BaseError} from 'application';
import templates, {Template} from 'infrastructure/mailService/templates';
import {sendMail} from 'infrastructure/mailService';
import storageService from 'infrastructure/storageService';
import {httpReqHandler} from 'shared/infrastructure/http';
import {validateSubscription} from './utils';

const htmlTemplateForJobId = (jobId: string) => {
  // Quick fix for the template for the TE job
  if (jobId == '8182cb05-7f2a-467a-9c83-b58cad1acbaf') return Template.EmailConfirmationTE;
  return Template.EmailConfirmation;
};

export const ApplicantsAdapter = (db: DB) => {
  const create = httpReqHandler(async (req) => {
    const {formId} = req.params;
    const form = await db.forms.retrieve(null, formId);
    if (!form) throw new BaseError(404, 'Not Found');
    const tenant = await db.tenants.retrieve(form.tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');

    try {
      await validateSubscription(form.tenantId);
    } catch ({message}: any) {
      return {view: 'form-submission', body: {error: message}};
    }

    if (form.formCategory !== 'application') {
      const errorMsg = 'Only application form are allowed to be submitted via html';
      throw new BaseError(402, errorMsg);
    }

    // formidable.maxFileSize = 500 * 1024 * 1024;
    return new Promise((resolve, reject) => {
      formidable().parse(req, async (error, fields, files) => {
        if (error) return resolve({view: 'form-submission', body: {error}});

        const promises = [];

        type Attributes = {formFieldId: string; attributeValue: string}[];
        let attributes: Attributes;
        try {
          attributes = form.formFields.reduce((acc, item) => {
            // !> filter out non submitted values
            const field = fields[item.id];

            const file = files[item.id]?.shift();
            const fileExists = file && file.size;

            if (!field && !fileExists) {
              if (item.required) {
                throw new BaseError(402, `Missing required field: ${item.label}`);
              }

              return acc;
            }

            if (['input', 'textarea', 'select', 'radio'].includes(item.component)) {
              if (!field) return acc;
              acc.push({formFieldId: item.id, attributeValue: field[0]});
            } else if (item.component === 'checkbox') {
              if (!field) return acc;
              const value = field.join(', ');

              acc.push({formFieldId: item.id, attributeValue: value});
            } else if (item.component === 'file_upload') {
              if (!file) return acc;
              const extension = file.originalFilename?.substr(
                file.originalFilename?.lastIndexOf('.') + 1,
              );
              const fileId = (Math.random() * 1e32).toString(36);
              const fileKey = form.tenantId + '.' + fileId + '.' + extension;
              const fileStream = fs.createReadStream(file.filepath);
              const params = {path: fileKey, contentType: file.mimetype || '', data: fileStream};

              const pro = new Promise(async (resolve, reject) => {
                const res = await storageService.upload(params).catch(reject);
                fs.unlinkSync(file.filepath);
                resolve(res);
              });

              promises.push(pro);

              acc.push({formFieldId: item.id, attributeValue: fileKey});
            }

            return acc;
          }, [] as Attributes);
        } catch (error) {
          return resolve({view: 'form-submission', body: {error}});
        }

        const applicant = {
          applicantId: uuid(), // TODO: change sothat application layer is not responsable for creating ids
          tenantId: form.tenantId,
          jobId: form.jobId,
          attributes,
        };
        promises.push(db.applicants.create(applicant));

        try {
          await Promise.all(promises);
        } catch (error: any) {
          return resolve({view: 'form-submission', body: {error: error.message}});
        }

        const {emailFieldId, fullNameFieldId} = form.formFields.reduce((acc, curr) => {
          if (curr.label === 'E-Mail-Adresse') acc.emailFieldId = curr.id;
          if (curr.label === 'Vollständiger Name') acc.fullNameFieldId = curr.id;
          return acc;
        }, {} as any);
        if (!fullNameFieldId)
          return reject(new BaseError(500, 'Vollständiger-Name field not found'));

        if (emailFieldId) {
          const {email, fullName} = attributes.reduce((acc, curr) => {
            if (curr.formFieldId === emailFieldId) acc.email = curr.attributeValue;
            if (curr.formFieldId === fullNameFieldId) acc.fullName = curr.attributeValue;
            return acc;
          }, {} as any);

          if (!email) return reject(new BaseError(500, 'Applicant has no email-adress'));
          if (!fullName) return reject(new BaseError(500, 'Applicant has no email-adress'));

          const templateOptions = {tenantName: tenant.tenantName, fullName};
          let html = templates(htmlTemplateForJobId(form.jobId), templateOptions);
          const mailOptions = {to: email, subject: 'Bewerbungsbestätigung', html};
          await sendMail(mailOptions).catch(console.error);
        }

        resolve({view: 'form-submission'});
      });
    });
  });

  return {create};
};
