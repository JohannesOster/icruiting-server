import {v4 as uuidv4} from 'uuid';

type BaseApplicant = {
  tenantId: string;
  jobId: string;
  attributes: {key: string; value: string}[];
  files: {key: string; value: string}[];
};
export type Applicant = {
  applicantId: string;
} & BaseApplicant;

export const createApplicant = (
  applicant: BaseApplicant & {applicantId: string},
): Applicant => {
  return Object.freeze({
    ...applicant,
    applicantId: applicant.applicantId || uuidv4(),
  });
};
