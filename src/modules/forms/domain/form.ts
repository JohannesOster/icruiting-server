import {
  createEntity,
  Entity,
  EntityFactory,
  ValidationError,
} from 'shared/domain';
import {FormField} from './formField';

export type FormCategory =
  | 'application'
  | 'screening'
  | 'assessment'
  | 'onboarding';

interface BaseForm {
  tenantId: string;
  jobId: string;
  /** The category of the form */
  formCategory: FormCategory;
  /** A human readable name for the form */
  formTitle?: string;
  /** The unique id of the form this form is a replica of (replicas "inherit" all formFields) */
  replicaOf?: string;
  /** A list of formFields */
  formFields: FormField[];
}

export interface Form extends BaseForm, Entity {}

export const createForm: EntityFactory<BaseForm, Form> = (props, id) => {
  const {tenantId, jobId, formCategory, formTitle, replicaOf, formFields} =
    props;

  validateFormTitle(formCategory, formTitle);
  validateFormFields(formCategory, formFields);

  const form: BaseForm = {
    tenantId,
    jobId,
    formCategory,
    formTitle,
    replicaOf,
    formFields,
  };

  return createEntity(form, id);
};

const validateFormTitle = (formCategory: FormCategory, formTitle?: string) => {
  if (formCategory === 'application' && formTitle)
    throw new ValidationError('Application form must not have a formTitle');
  if (formCategory === 'screening' && formTitle)
    throw new ValidationError('Screening form must not have a formTitle');
  if (formCategory === 'assessment' && !formTitle)
    throw new ValidationError('Assessment form must have a formTitle');
  if (formCategory === 'onboarding' && !formTitle)
    throw new ValidationError('Onboarding form must have a formTitle');
};

const validateFormFields = (
  formCategory: FormCategory,
  formFields: FormField[],
) => {
  if (formCategory != 'application') return; // no validation required

  let nameField: FormField | undefined = undefined;
  let emailField: FormField | undefined = undefined;
  for (const formField of formFields) {
    if (formField.label === 'Vollständiger Name') nameField = formField;
    else if (formField.label === 'E-Mail-Adresse') emailField = formField;

    if (nameField && emailField) return;
  }

  if (!nameField)
    throw new ValidationError('Application form requires name field');
  if (!emailField)
    throw new ValidationError('Application form requires email field');
};
