import {Entity, EntityFactory, createEntity} from 'shared/domain';
import {v4 as uuid} from 'uuid';

export type Attribute = {
  /** The unique id of the formField the attribute originates from */
  formFieldId: string;
  /** The actual attribute value */
  value: string;
};

export type File = {
  /** The unique id of the formField the file originates from */
  formFieldId: string;
  /** The uri to the actual file */
  uri: string;
};
export type ApplicantStatus = 'applied' | 'confirmed';

interface BaseApplicant {
  /** The current status the applicant is in
   * applied: The initial status of the applicant
   * confirmed: The applicant was confirmed by an administrator
   */
  applicantStatus: ApplicantStatus;
  /** The unique id of the job the applicant has applied for */
  jobId: string;
  /** A list of attributes the applicant has */
  attributes: Attribute[];
  /** A list of files the applicant has */
  files: File[];
}
export interface Applicant extends BaseApplicant, Entity {}

export const createApplicant: EntityFactory<BaseApplicant, Applicant> = (
  props,
  id,
): Applicant => {
  const {applicantStatus, jobId, attributes, files} = props;
  const applicant: BaseApplicant = {applicantStatus, jobId, attributes, files};
  return createEntity(applicant, id);
};
