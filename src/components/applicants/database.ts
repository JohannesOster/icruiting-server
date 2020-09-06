import db from '../../db';
import {selectApplicants, selectReport} from './sql';
import {TApplicant} from './types';

export const dbInsertApplicant = (applicant: TApplicant) => {
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

export const dbSelectApplicants = (params: {
  job_id?: string;
  organization_id: string;
  user_id: string;
}) => {
  return db.any(selectApplicants, params);
};

export const dbSelectReport = (params: {
  organization_id: string;
  applicant_id: string;
  form_category: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params);
};
