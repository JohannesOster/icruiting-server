import db from 'db';
import {decamelizeKeys} from 'humps';

type DbInsertApplicantReportParams = {
  jobId: string;
  tenantId: string;
  attributes: string[];
  image: string;
};
export const dbInsertApplicantReport = async ({
  jobId,
  tenantId,
  attributes,
  image,
}: DbInsertApplicantReportParams) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const params = decamelizeKeys({jobId, tenantId, image});
  const insertApplicantReportStmt =
    insert(params, null, 'applicant_report') + ' RETURNING *';
  const insertedApplicantReport = await db.one(insertApplicantReportStmt);

  if (!attributes.length) {
    return Promise.resolve({attributes: [], ...insertedApplicantReport});
  }

  const columns = ['applicant_report_id', 'form_field_id'];
  const options = {table: 'applicant_report_field'};
  const cs = new ColumnSet(columns, options);

  const attrs = attributes.map((formFieldId) => ({
    applicantReportId: insertedApplicantReport.applicantReportId,
    formFieldId,
  }));

  const attrsStmt =
    insert(
      attrs.map((attr) => decamelizeKeys(attr)),
      cs,
    ) + ' RETURNING *';

  return db
    .any(attrsStmt)
    .then((attributes) => ({attributes, ...insertedApplicantReport}));
};

type DbUpdateApplicantReportParams = {
  applicantReportId: string;
  tenantId: string;
  attributes: string[];
  image: string;
};
export const dbUpdateApplicantReport = async ({
  applicantReportId,
  tenantId,
  attributes,
  image,
}: DbUpdateApplicantReportParams) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const stmt =
    'UPDATE applicant_report SET image=${image} WHERE applicant_report_id=${applicant_report_id} AND tenant_id=${tenant_id} RETURNING *';
  const updatedReport = await db.one(
    stmt,
    decamelizeKeys({
      applicantReportId,
      image,
      tenantId,
    }),
  );

  const delStmt =
    'DELETE FROM applicant_report_field WHERE applicant_report_id=${applicant_report_id}';
  await db.none(delStmt, decamelizeKeys({applicantReportId}));

  if (!attributes.length) {
    return Promise.resolve({attributes: [], ...updatedReport});
  }

  const columns = ['applicant_report_id', 'form_field_id'];
  const options = {table: 'applicant_report_field'};
  const cs = new ColumnSet(columns, options);

  const attrs = attributes.map((formFieldId) => ({
    applicantReportId: applicantReportId,
    formFieldId,
  }));

  const attrsStmt =
    insert(
      attrs.map((attr) => decamelizeKeys(attr)),
      cs,
    ) + ' RETURNING *';

  return db
    .any(attrsStmt)
    .then((attributes) => ({attributes, ...updatedReport}));
};
