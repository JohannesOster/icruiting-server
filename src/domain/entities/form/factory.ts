import {ValidationError} from 'domain/entities/error';
import {v4 as uuid} from 'uuid';
import {BaseForm, BaseFormField, Form, FormCategory} from './types';

type Params = BaseForm & {
  formId?: string;
  formFields: (BaseFormField & {formFieldId?: string})[];
};

export const createForm = (form: Params): Form => {
  const formId = form.formId || uuid();
  const formFields = form.formFields.map((field) => ({
    ...field,
    formId,
    formFieldId: field.formFieldId || uuid(),
  }));

  validateFormTitle(form.formCategory, form.formTitle);

  return Object.freeze({...form, formId, formFields});
};

const validateFormTitle = (formCategory: FormCategory, formTitle?: string) => {
  if (['application', 'screening'].includes(formCategory)) {
    if (!!formTitle) {
      const message = `${formCategory}-forms are not allowed to have a formTitle.`;
      throw new ValidationError(message);
    }
  } else {
    if (!formTitle) {
      const message = `${formCategory}-forms require a formTitle.`;
      throw new ValidationError(message);
    }
  }
};
