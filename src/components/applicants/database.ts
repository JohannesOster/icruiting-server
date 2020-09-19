import db from '../../db';
import {selectApplicants, selectReport, selectApplicant} from './sql';
import {TApplicantDb} from './types';

export const dbInsertApplicant = async (applicant: TApplicantDb) => {
  const helpers = db.$config.pgp.helpers;

  try {
    const {tenant_id, job_id} = applicant;
    const applStmt =
      helpers.insert({tenant_id, job_id}, null, 'applicant') + ' RETURNING *';
    const {applicant_id} = await db.one(applStmt);

    const cs = new helpers.ColumnSet(
      ['applicant_id', 'form_field_id', 'attribute_value'],
      {table: 'applicant_attribute'},
    );

    const values = applicant.attributes.map((attribute) => ({
      ...attribute,
      applicant_id,
    }));

    const attrStmt = helpers.insert(values, cs);

    await db.any(attrStmt);

    return dbSelectApplicant(applicant_id, applicant.tenant_id).then(
      (res) => res[0],
    );
  } catch (error) {
    return Promise.reject(error);
  }
};

export const dbSelectApplicants = (params: {
  job_id?: string;
  tenant_id: string;
  user_id: string;
}) => {
  return db.any(selectApplicants, params);
};

export const dbSelectApplicant = (applicant_id: string, tenant_id: string) => {
  return db.any(selectApplicant, {applicant_id, tenant_id});
};

export const dbSelectReport = (params: {
  tenant_id: string;
  applicant_id: string;
  form_category: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params);
};

export const dbDeleteApplicant = (applicant_id: string) => {
  return db.none('DELETE FROM applicant WHERE applicant_id=$1', applicant_id);
};

export const dbUpdateApplicant = async (
  tenant_id: string,
  applicant_id: string,
  applicant_attributes: [{form_field_id: string; attriubte_value: string}],
) => {
  const helpers = db.$config.pgp.helpers;

  const delCond = ' WHERE applicant_id=${applicant_id}';
  const delStmt = 'DELETE FROM applicant_attribute' + delCond;
  await db.none(delStmt, {applicant_id});

  const cs = new helpers.ColumnSet(
    ['applicant_id', 'form_field_id', 'attribute_value'],
    {table: 'applicant_attribute'},
  );

  const values = applicant_attributes.map((attribute) => ({
    ...attribute,
    applicant_id,
  }));

  const stmt = helpers.insert(values, cs);
  await db.any(stmt);
};
