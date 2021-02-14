import {v4 as uuidv4} from 'uuid';

type Attribute = {key: string; value: string};
type BaseApplicant = {
  tenantId: string;
  jobId: string;
  attributes: Attribute[];
  files: Attribute[];
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
