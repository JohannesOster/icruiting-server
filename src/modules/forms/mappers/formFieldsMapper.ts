import {FormField as DBFormField} from '../infrastructure/db/repositories/forms';
import {createFormField, FormField} from '../domain';

interface FormFieldEnhancer {
  formId: string;
}

const toPersistance = (
  {formId}: FormFieldEnhancer,
  formField: FormField,
): DBFormField => {
  const {id: formFieldId, options: _options, ..._formField} = formField;
  const options = _options?.map(({id, ...option}) => ({
    optionId: id,
    ...option,
  }));

  return Object.freeze({formId, formFieldId, options, ..._formField});
};

const toDomain = (raw: DBFormField): FormField => {
  const {formFieldId, options: _options, ..._formField} = raw;
  const options = _options?.map(({optionId: id, ...option}) => ({
    id,
    ...option,
  }));
  return createFormField({..._formField, options}, formFieldId);
};

const toDTO = ({formId}: FormFieldEnhancer, formField: FormField) => {
  const {id: formFieldId, options: _options, ..._formField} = formField;
  const options = _options?.map(({id, ...option}) => ({
    optionId: id,
    ...option,
  }));

  return Object.freeze({formId, formFieldId, options, ..._formField});
};

export const formFieldsMapper = {toPersistance, toDomain, toDTO};
