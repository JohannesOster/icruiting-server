import db from '../../db';
import {
  selectApplicants,
  selectReport,
  selectApplicant,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';
import {TApplicantDb} from './types';

export const dbInsertApplicant = async ({
  tenantId,
  jobId,
  attributes,
}: TApplicantDb) => {
  const helpers = db.$config.pgp.helpers;

  try {
    const params = {tenantId, jobId};
    const applStmt = helpers.insert(params, null, 'applicant') + ' RETURNING *';
    const {applicantId} = await db.one(applStmt);

    const columns = ['applicantId', 'formFieldId', 'attributeValue'];
    const options = {table: 'applicantAttribute'};
    const cs = new helpers.ColumnSet(columns, options);
    const attrs = attributes.map((attribute) => ({
      ...attribute,
      applicantId,
    }));
    const attrStmt = helpers.insert(attrs, cs);
    await db.any(attrStmt);

    return dbSelectApplicant(applicantId, tenantId);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const dbSelectApplicants = (params: {
  jobId?: string;
  applicantId?: string;
  tenantId: string;
  userId: string;
}) => {
  const defaultParams = {jobId: null, applicantId: null};
  return db.any(selectApplicants, {...defaultParams, ...params});
};

export const dbSelectApplicant = (applicantId: string, tenantId: string) => {
  return db.any(selectApplicant, {applicantId, tenantId}).then((res) => res[0]);
};

export const dbSelectReport = (params: {
  tenantId: string;
  applicantId: string;
  formCategory: 'screening' | 'assessment';
}) => {
  return db.any(selectReport, params).then((resp) => resp[0]);
};

export const dbDeleteApplicant = (applicantId: string, tenantId: string) => {
  const stmt =
    'DELETE FROM applicant' +
    ' WHERE applicantId=${applicantId} AND tenantId=${tenantId}';
  return db.none(stmt, {applicantId, tenantId});
};

export const dbUpdateApplicant = async (
  applicantId: string,
  applicantAttributes: [{formFieldId: string; attriubteValue: string}],
) => {
  const helpers = db.$config.pgp.helpers;

  const delCond = ' WHERE applicantId=${applicantId}';
  const delStmt = 'DELETE FROM applicantAttribute' + delCond;
  await db.none(delStmt, {applicantId});

  const columns = ['applicantId', 'formFieldId', 'attributeValue'];
  const options = {table: 'applicantAttribute'};
  const cs = new helpers.ColumnSet(columns, options);
  const attributes = applicantAttributes.map((attribute) => ({
    ...attribute,
    applicantId,
  }));

  const stmt = helpers.insert(attributes, cs);
  return db.any(stmt);
};

export const dbSelectApplicantReport = (tenantId: string, jobId: string) => {
  return db
    .any(selectApplicantReportSQL, {tenantId, jobId})
    .then((resp) => resp[0]);
};
