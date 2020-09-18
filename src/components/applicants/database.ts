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

export const dbSelectApplicant = (applicant_id: string, tenant_id: string) => {
  const stmt =
    'SELECT * FROM applicant WHERE applicant_id=${applicant_id} AND tenant_id=${tenant_id}';
  return db.any(stmt, {applicant_id, tenant_id});
};

export const dbSelectReport = (params: {
  tenant_id: string;
  applicant_id: string;
  form_category: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params);
};

export const dbSelectApplicantFiles = (applicant_id: string) => {
  const stmt = 'SELECT files FROM applicant WHERE applicant_id=$1';
  return db.any(stmt, applicant_id);
};

export const dbDeleteApplicant = (applicant_id: string) => {
  return db.none('DELETE FROM applicant WHERE applicant_id=$1', applicant_id);
};

export const dbUpdateApplicant = (
  tenant_id: string,
  applicant_id: string,
  attributes: [{[key: string]: string}],
) => {
  const helpers = db.$config.pgp.helpers;

  const cs = new helpers.ColumnSet(
    [{name: 'attributes', mod: ':json', cast: 'jsonb'}],
    {table: 'applicant'},
  );

  const condition =
    ' WHERE applicant_id = ${applicant_id} AND tenant_id = ${tenant_id} RETURNING *';
  const stmt = helpers.update({attributes}, cs) + condition;
  return db.one(stmt, {tenant_id, applicant_id});
};
