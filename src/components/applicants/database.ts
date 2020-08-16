import db from '../../db';
import {selectApplicants as selectApplicantsSQL} from './sql';
import {TApplicant} from './types';

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

export const selectApplicants = (params: {
  job_id?: string;
  organization_id: string;
  user_id: string;
}) => {
  return db.any(selectApplicantsSQL, params);
};
