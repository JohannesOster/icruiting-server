import {createEntity, Entity, EntityFactory} from 'shared/domain';

interface BaseFormSubmission {
  /** The unique id of the form the formSubmission belongs to */
  formId: string;
  /** The unique id of the user the formSubmission was created by */
  submitterId: string;
  /** The unique id of the applicant the formSubmission refers to */
  applicantId: string;
  /** The submission values as key-value pairs
   * key: The unique id of the formField the value was submitted with
   * value: The submission value
   */
  submission: {[formFieldId: string]: string};
}

export interface FormSubmission extends BaseFormSubmission, Entity {}

export const createFormSubmission: EntityFactory<
  BaseFormSubmission,
  FormSubmission
> = (props, id): FormSubmission => {
  const {formId, submitterId, applicantId, submission} = props;
  const formSubmission: BaseFormSubmission = {
    formId,
    submitterId,
    applicantId,
    submission,
  };
  return createEntity(formSubmission, id);
};
