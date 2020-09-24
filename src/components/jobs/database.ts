import db from 'db';

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

  const params = {jobId, tenantId, image};
  const insertApplicantReportStmt =
    insert(params, null, 'applicant_report') + ' RETURNING *';
  const insertedApplicantReport = await db.one(insertApplicantReportStmt);

  if (!attributes.length) {
    return Promise.resolve({attributes: [], ...insertedApplicantReport});
  }

  const columns = ['applicantReportId', 'formFieldId'];
  const options = {table: 'applicant_report_field'};
  const cs = new ColumnSet(columns, options);

  const attrs = attributes.map((formFieldId) => ({
    applicantReportId: insertedApplicantReport.applicantReportId,
    formFieldId,
  }));

  const attrsStmt = insert(attrs, cs) + ' RETURNING *';

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
    'UPDATE applicant_report SET image=${image} WHERE applicantReportId=${applicantReportId} AND tenantId=${tenantId} RETURNING *';
  const updatedReport = await db.one(stmt, {
    applicantReportId,
    image,
    tenantId,
  });

  const delStmt =
    'DELETE FROM applicant_report_field WHERE applicantReportId=${applicantReportId}';
  await db.none(delStmt, {applicantReportId});

  if (!attributes.length) {
    return Promise.resolve({attributes: [], ...updatedReport});
  }

  const columns = ['applicantReportId', 'formFieldId'];
  const options = {table: 'applicant_report_field'};
  const cs = new ColumnSet(columns, options);

  const attrs = attributes.map((formFieldId) => ({
    applicantReportId: applicantReportId,
    formFieldId,
  }));

  const attrsStmt = insert(attrs, cs) + ' RETURNING *';

  return db
    .any(attrsStmt)
    .then((attributes) => ({attributes, ...updatedReport}));
};
