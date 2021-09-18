import {createFormSubmission, FormSubmission} from '../domain';
import {FormSubmission as DBFormSubmission} from '../infrastructure/repositories/formSubmissions/types';

const toPersistance = (
  tenantId: string,
  formSubmission: FormSubmission,
): DBFormSubmission => {
  const {id: formSubmissionId, ..._formSubmission} = formSubmission;
  return Object.freeze({tenantId, formSubmissionId, ..._formSubmission});
};

const toDomain = (raw: DBFormSubmission): FormSubmission => {
  const {formSubmissionId, tenantId, ...formSubmission} = raw;
  return createFormSubmission({...formSubmission}, formSubmissionId);
};

const toDTO = (tenantId: string, formSubmission: FormSubmission) => {
  return toPersistance(tenantId, formSubmission);
};

export const formSubmissionsMapper = {toPersistance, toDomain, toDTO};
