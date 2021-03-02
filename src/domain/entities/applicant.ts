import {v4 as uuidv4} from 'uuid';

export type Attribute = {formFieldId: string; value: string};
export type File = {formFieldId: string; uri: string};
type BaseApplicant = {
  confirmed: boolean;
  tenantId: string;
  jobId: string;
  attributes: Attribute[];
  files: File[];
};
export type Applicant = {applicantId: string} & BaseApplicant;

export const createApplicant = (
  applicant: BaseApplicant & {applicantId: string},
): Applicant => {
  return Object.freeze({
    ...applicant,
    applicantId: applicant.applicantId || uuidv4(),
  });
};
