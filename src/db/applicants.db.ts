import db from '.';
import {selectApplicants as selectApplicantsSQL} from './sql';

export const insertApplicant = (params: any) => {
  const stmt =
    db.$config.pgp.helpers.insert(params, null, 'applicant') + ' RETURNING *';
  return db.any(stmt);
};

type TSelectParams = {
  organization_id: string;
  job_id?: string;
  user_id: string;
};
export const selectApplicants = (params: TSelectParams) => {
  return db.any(selectApplicantsSQL, params);
};
