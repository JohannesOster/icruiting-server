import db from '../../db';
import {selectApplicants, selectReport, selectApplicant} from './sql';
import {TApplicantDb} from './types';

export const dbInsertApplicant = async ({
  tenant_id,
  job_id,
  attributes,
}: TApplicantDb) => {
  const helpers = db.$config.pgp.helpers;

  try {
    const params = {tenant_id, job_id};
    const applStmt = helpers.insert(params, null, 'applicant') + ' RETURNING *';
    const {applicant_id} = await db.one(applStmt);

    const columns = ['applicant_id', 'form_field_id', 'attribute_value'];
    const options = {table: 'applicant_attribute'};
    const cs = new helpers.ColumnSet(columns, options);
    const attrs = attributes.map((attribute) => ({
      ...attribute,
      applicant_id,
    }));
    const attrStmt = helpers.insert(attrs, cs);
    await db.any(attrStmt);

    return dbSelectApplicant(applicant_id, tenant_id);
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
  return db
    .any(selectApplicant, {applicant_id, tenant_id})
    .then((res) => res[0]);
};

export const dbSelectReport = (params: {
  tenant_id: string;
  applicant_id: string;
  form_category: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params);
};

export const dbDeleteApplicant = (applicant_id: string, tenant_id: string) => {
  const stmt =
    'DELETE FROM applicant' +
    ' WHERE applicant_id=${applicant_id} AND tenant_id=${tenant_id}';
  return db.none(stmt, {applicant_id, tenant_id});
};

export const dbUpdateApplicant = async (
  applicant_id: string,
  applicant_attributes: [{form_field_id: string; attriubte_value: string}],
) => {
  const helpers = db.$config.pgp.helpers;

  const delCond = ' WHERE applicant_id=${applicant_id}';
  const delStmt = 'DELETE FROM applicant_attribute' + delCond;
  await db.none(delStmt, {applicant_id});

  const columns = ['applicant_id', 'form_field_id', 'attribute_value'];
  const options = {table: 'applicant_attribute'};
  const cs = new helpers.ColumnSet(columns, options);
  const attributes = applicant_attributes.map((attribute) => ({
    ...attribute,
    applicant_id,
  }));

  const stmt = helpers.insert(attributes, cs);
  await db.any(stmt);
};
