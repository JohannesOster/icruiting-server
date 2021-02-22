import fs from 'fs';
import {IncomingForm} from 'formidable';
import {httpReqHandler, BaseError} from 'application/errorHandling';
import db from 'infrastructure/db';
import config from 'config';
import {validateSubscription} from './utils';
import templates, {Template} from 'infrastructure/mailService/templates';
import {sendMail} from 'infrastructure/mailService';
import storageService from 'infrastructure/storageService';
import {createForm} from 'domain/entities';

export const FormsAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const form = createForm({...req.body, tenantId});
    const resp = await db.forms.create(form);
    return {status: 201, body: resp};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {formId} = req.params;
    const resp = await db.forms.retrieve(tenantId, formId);
    if (!resp) throw new BaseError(404, 'Not Found');
    return {body: resp};
  });

  const update = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const params = {...req.body, tenantId};
    const resp = await db.forms.update(params);
    return {body: resp};
  });

  const del = httpReqHandler(async (req) => {
    const {formId} = req.params;
    const {tenantId} = req.user;
    await db.forms.del(tenantId, formId);
    return {};
  });

  const list = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const jobId = req.query.jobId as string;
    const resp = await db.forms.list(tenantId, {jobId});
    return {body: resp};
  });

  const exportForm = httpReqHandler(async (req) => {
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

    return {file: {name: 'form.json', data: form}};
  });

  const renderHTMLForm = httpReqHandler(async (req) => {
    const {formId} = req.params;
    const form = await db.forms.retrieve(null, formId);
    if (!form) throw new BaseError(404, 'Not Found');

    try {
      await validateSubscription(form.tenantId);
    } catch ({message}) {
      return {view: 'form', body: {error: message}};
    }

    const submitAction = config.baseURL + req.originalUrl;
    const params = {formId, submitAction, formFields: form.formFields};
    const tenant = await db.tenants.retrieve(form.tenantId);
    if (!tenant?.theme) return {view: 'form', body: params};

    const url = storageService.getUrl(tenant.theme);

    return {view: 'form', body: {...params, theme: url}};
  });

  const submitHTMLForm = httpReqHandler(async (req) => {
    const {formId} = req.params;
    const form = await db.forms.retrieve(null, formId);
    if (!form) throw new BaseError(404, 'Not Found');
    const tenant = await db.tenants.retrieve(form.tenantId);
    if (!tenant) throw new BaseError(404, 'Tenant Not Found');

    try {
      await validateSubscription(form.tenantId);
    } catch ({message}) {
      return {view: 'form-submission', body: {error: message}};
    }

    if (form.formCategory !== 'application') {
      const errorMsg =
        'Only application form are allowed to be submitted via html';
      throw new BaseError(402, errorMsg);
    }

    const formidable = new IncomingForm();
    formidable.maxFileSize = 500 * 1024 * 1024;
    return new Promise((resolve) => {
      formidable.parse(req, async (error, fields, files) => {
        if (error) return resolve({view: 'form-submission', body: {error}});

        const promises = [];

        type Attributes = {formFieldId: string; attributeValue: string}[];
        let attributes: Attributes;
        try {
          attributes = form.formFields.reduce((acc, item) => {
            // !> filter out non submitted values
            const field = fields[item.formFieldId];
            let file = files[item.formFieldId];
            if (Array.isArray(file)) file = file[0];
            const fileExists = file && file.size;
            if (!field && !fileExists) {
              if (item.required) {
                throw new BaseError(
                  402,
                  `Missing required field: ${item.label}`,
                );
              }

              return acc;
            }

            if (
              ['input', 'textarea', 'select', 'radio'].includes(item.component)
            ) {
              acc.push({
                formFieldId: item.formFieldId,
                attributeValue: field as string,
              });
            } else if (item.component === 'checkbox') {
              const value = Array.isArray(field)
                ? (field as string[]).join(', ')
                : (field as string);

              acc.push({
                formFieldId: item.formFieldId,
                attributeValue: value,
              });
            } else if (item.component === 'file_upload') {
              const extension = file.name.substr(
                file.name.lastIndexOf('.') + 1,
              );
              const fileId = (Math.random() * 1e32).toString(36);
              const fileKey = form.tenantId + '.' + fileId + '.' + extension;
              const fileStream = fs.createReadStream(file.path);
              const params = {
                path: fileKey,
                contentType: file.type,
                data: fileStream,
              };
              promises.push(storageService.upload(params));

              fs.unlink(file.path, console.error);

              acc.push({
                formFieldId: item.formFieldId,
                attributeValue: fileKey,
              });
            }

            return acc;
          }, [] as Attributes);
        } catch (error) {
          return resolve({view: 'form-submission', body: {error}});
        }

        const applicant = {
          tenantId: form.tenantId,
          jobId: form.jobId,
          attributes,
        };
        promises.push(db.applicants.create(applicant));

        try {
          await Promise.all(promises);
        } catch ({message}) {
          return resolve({view: 'form-submission', body: {error: message}});
        }

        const {emailFieldId, fullNameFieldId} = form.formFields.reduce(
          (acc, curr) => {
            if (curr.label === 'E-Mail-Adresse')
              acc.emailFieldId = curr.formFieldId;
            if (curr.label === 'Vollständiger Name')
              acc.fullNameFieldId = curr.formFieldId;
            return acc;
          },
          {} as any,
        );
        if (!emailFieldId)
          throw new BaseError(500, 'E-Mail-Adresse field not found');
        if (!fullNameFieldId)
          throw new BaseError(500, 'Vollständiger-Name field not found');

        const {email, fullName} = attributes.reduce((acc, curr) => {
          if (curr.formFieldId === emailFieldId)
            acc.email = curr.attributeValue;
          if (curr.formFieldId === fullNameFieldId)
            acc.fullName = curr.attributeValue;
          return acc;
        }, {} as any);

        if (!email) throw new BaseError(500, 'Applicant has no email-adress');
        if (!fullName)
          throw new BaseError(500, 'Applicant has no email-adress');

        const templateOptions = {tenantName: tenant.tenantName, fullName};
        const html = templates(Template.EmailConfirmation, templateOptions);
        const mailOptions = {to: email, subject: 'Bewerbungsbestätigung', html};
        await sendMail(mailOptions).catch(console.error);

        resolve({view: 'form-submission'});
      });
    });
  });

  return {
    create,
    retrieve,
    update,
    del,
    list,
    exportForm,
    renderHTMLForm,
    submitHTMLForm,
  };
};
