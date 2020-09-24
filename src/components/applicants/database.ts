import db from '../../db';
import {
  selectReport,
  selectApplicantReport as selectApplicantReportSQL,
} from './sql';

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
