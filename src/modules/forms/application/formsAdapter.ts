import {v4 as uuid} from 'uuid';
import config from 'config';
import {DB} from '../infrastructure/db';
import {BaseError} from 'application';
import {validateSubscription} from './utils';
import storageService from 'infrastructure/storageService';
import {createForm} from 'modules/forms/domain/form';
import {httpReqHandler} from 'shared/infrastructure/http';
import {formsMapper} from '../mappers';
import {formFieldsMapper} from '../mappers/formFieldsMapper';

export const FormsAdapter = (db: DB) => {
  const create = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {formId, jobId} = req.body;

    const form = createForm({tenantId, jobId, ...req.body}, formId);
    const params = formsMapper.toPersistance(form);
    const raw = await db.forms.create(params);
    const body = formsMapper.toDTO(raw);

    return {status: 201, body};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {formId} = req.params;
    const resp = await db.forms.retrieve(tenantId, formId);
    if (!resp) throw new BaseError(404, 'Not Found');
    return {body: formsMapper.toDTO(resp)};
  });

  const update = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {formId} = req.params;

    const form = await db.forms.retrieve(tenantId, formId);
    if (!form) throw new BaseError(404, 'Not Found');

    const updatedForm = createForm({tenantId, jobId: form.jobId, ...req.body}, formId);
    const params = formsMapper.toPersistance(updatedForm);
    const raw = await db.forms.update(params);
    const body = formsMapper.toDTO(raw);

    return {body};
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
    const forms = await db.forms.list(tenantId, {jobId});
    return {body: forms.map(formsMapper.toDTO)};
  });

  const exportForm = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {formId} = req.params;
    const form = await db.forms.retrieve(tenantId, formId); // has to be any in order to delete props
    if (!form) throw new BaseError(404, 'Not Found');

    const body = {
      formCategory: form.formCategory,
      formFields: form.formFields.map(({jobRequirementId, ...formField}) => ({
        ...formField,
        formFieldId: uuid(), // remove db primary key but provide unique identity
      })),
    };

    return {body};
  });

  const renderHTMLForm = httpReqHandler(async (req) => {
    const {formId} = req.params;
    const form = await db.forms.retrieve(null, formId);
    if (!form) throw new BaseError(404, 'Not Found');

    try {
      await validateSubscription(form.tenantId);
    } catch ({message}: any) {
      return {view: 'form', body: {error: message}};
    }

    const submitAction = config.get('baseUrl') + req.originalUrl;
    const params = {
      formId,
      submitAction,
      formFields: form.formFields.map((field) => formFieldsMapper.toDTO({formId}, field)),
    };
    const tenant = await db.tenants.retrieve(form.tenantId);
    if (!tenant?.theme) return {view: 'form', body: params};

    const url = await storageService.getUrl(tenant.theme);

    return {view: 'form', body: {...params, theme: url}};
  });

  return {
    create,
    retrieve,
    update,
    del,
    list,
    exportForm,
    renderHTMLForm,
  };
};
