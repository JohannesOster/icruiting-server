import {ValidationError} from 'domain/entities/error';
import {v4 as uuid} from 'uuid';
import {BaseForm, BaseFormField, Form, FormCategory} from './types';

type Params = BaseForm & {
  formId?: string;
  formFields: (BaseFormField & {formFieldId?: string})[];
};

export const createForm = (form: Params): Form => {
  validateFormTitle(form.formCategory, form.formTitle);
  validateFormFields(form.formCategory, form.formFields);

  const formId = form.formId || uuid();
  const formFields = form.formFields.map((field) => ({
    ...field,
    formId,
    formFieldId: field.formFieldId || uuid(),
  }));

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

/*
A form is an aggregation of custom formFields. I did not find a better way to
require specific fields (email and name) for an application form than to make
the domain entity "depend" on the german language.
*/
const validateFormFields = (
  formCategory: FormCategory,
  formFields: BaseFormField[],
) => {
  if (formCategory !== 'application') return;

  const emailLabel = 'E-Mail-Adresse';
  const emailField = formFields.find(({label}) => label === emailLabel);
  if (!emailField) {
    const message = `${emailLabel} is required for ${formCategory}-form`;
    throw new ValidationError(message);
  }

  const nameLabel = 'Vollständiger Name';
  const nameField = formFields.find(({label}) => label === nameLabel);
  if (!nameField) {
    const message = `${nameLabel} is required for ${formCategory}-form`;
    throw new ValidationError(message);
  }
};
