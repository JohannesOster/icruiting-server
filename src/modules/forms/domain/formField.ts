import {createEntity, Entity, EntityFactory} from 'shared/domain';

export type FormFieldIntent = 'sum_up' | 'aggregate' | 'count_distinct';
export type FormFieldComponent =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file_upload'
  | 'rating_group'
  | 'section_header';
export type FormFieldVisibility = 'all' | 'authenticated' | 'admin';

interface BaseFormField {
  /** The vertical position of the formField inside its form */
  rowIndex: number;
  /** The component the formField should render as */
  component: FormFieldComponent;
  /** A human readable name for the formField */
  label: string;
  /** How the submission value should be evaluated. See the documentation for further explanation */
  intent?: FormFieldIntent;
  /** A human readable text displayed if there is no value in the formField.
   * Will only be relevant for some components (for instance in an input field) */
  placeholder?: string;
  /** A human readable further explaining the purpose of the field */
  description?: string;
  /** The default value of the formField */
  defaultValue?: string;
  /** Weather the formField is required */
  required?: boolean;
  /** A List of options for the formField.
   * Will only be relevant for some components (for instance a select component) */
  options?: {id: string; label: string; value: string}[];
  /** Weather the formField can be edited */
  editable?: boolean;
  /** Weather the formField can be removed from the form */
  deletable?: boolean;
  /** The unique id of the jobRequirement submissions for this field will belong to */
  jobRequirementId?: string;
  /** Indicates who is able to see (and therefor submit) this value */
  visibility: FormFieldVisibility;
  /** Additional properties */
  props?: {[key: string]: any};
}

export interface FormField extends BaseFormField, Entity {}

export const createFormField: EntityFactory<BaseFormField, FormField> = (
  props,
  id,
) => {
  const {
    rowIndex,
    component,
    label,
    intent,
    placeholder,
    description,
    defaultValue,
    required,
    options,
    editable,
    deletable,
    jobRequirementId,
    visibility,
    props: _props,
  }: BaseFormField = props;

  return createEntity(
    {
      rowIndex,
      component,
      label,
      intent,
      placeholder,
      description,
      defaultValue,
      required,
      options,
      editable,
      deletable,
      jobRequirementId,
      visibility,
      props: _props,
    },
    id,
  );
};
