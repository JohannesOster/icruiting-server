import {createForm, Form as FormEntity} from 'modules/forms/domain/form';
import {Form as DBForm} from 'modules/forms/infrastructure/db/repositories/forms';
import {formFieldsMapper} from './formFieldsMapper';

const toPersistance = (form: FormEntity): DBForm => {
  const {id: formId, formFields: _formFields, ..._form} = form;
  const formFields = _formFields.map((formField) =>
    formFieldsMapper.toPersistance({formId}, formField),
  );

  return Object.freeze({formId, formFields, ..._form});
};

const toDomain = (raw: DBForm): FormEntity => {
  const {formFields: _formFields, formId, ...form} = raw;
  const formFields = _formFields.map(formFieldsMapper.toDomain);
  return createForm({...form, formFields}, formId);
};

const toDTO = (form: FormEntity) => {
  const {id: formId, formFields: _formFields, ..._form} = form;
  const formFields = _formFields.map(({id: formFieldId, ...formField}) => {
    return {formFieldId, ...formField};
  });

  return Object.freeze({formId, ..._form, formFields});
};

export const formsMapper = {toPersistance, toDomain, toDTO};
