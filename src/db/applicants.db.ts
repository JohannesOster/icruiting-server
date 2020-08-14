import db from '.';
import {selectApplicants as selectApplicantsSQL} from './sql';
import {TApplicant} from 'controllers/applicants';

export const insertApplicant = (applicant: TApplicant) => {
  const helpers = db.$config.pgp.helpers;

  const cs = new helpers.ColumnSet(
    [
      'organization_id',
      'job_id',
      {name: 'attributes', mod: ':json', cast: 'jsonb'},
      {name: 'files', mod: ':json', cast: 'jsonb', def: null},
    ],
    {table: 'applicant'},
  );

  const stmt = helpers.insert(applicant, cs) + ' RETURNING *';
  return db.one(stmt);
};

type TSelectParams = {
  organization_id: string;
  job_id?: string;
  user_id: string;
};
export const selectApplicants = (params: TSelectParams) => {
  return db.any(selectApplicantsSQL, params);
};
