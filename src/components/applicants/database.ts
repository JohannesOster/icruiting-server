import db from '../../db';
import {selectApplicants, selectReport} from './sql';
import {TApplicant} from './types';

export const dbInsertApplicant = (applicant: TApplicant) => {
  const helpers = db.$config.pgp.helpers;

  const cs = new helpers.ColumnSet(
    [
      'tenant_id',
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
  tenant_id: string;
  user_id: string;
}) => {
  return db.any(selectApplicants, params);
};

export const dbSelectReport = (params: {
  tenant_id: string;
  applicant_id: string;
  form_category: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params);
};

export const dbSelectApplicantFiles = (applicant_id: string) => {
  const query = 'SELECT files FROM applicant WHERE applicant_id=$1';
  return db.any(query, applicant_id);
};

export const dbDeleteApplicant = (applicant_id: string) => {
  return db.none('DELETE FROM applicant WHERE applicant_id=$1', applicant_id);
};
