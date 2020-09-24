import db from 'db';

type DbInsertApplicantReportParams = {
  job_id: string;
  tenant_id: string;
  attributes: string[];
  image: string;
};
export const dbInsertApplicantReport = async ({
  job_id,
  tenant_id,
  attributes,
  image,
}: DbInsertApplicantReportParams) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const params = {job_id, tenant_id, image};
  const insertApplicantReportStmt =
    insert(params, null, 'applicant_report') + ' RETURNING *';
  const insertedApplicantReport = await db.one(insertApplicantReportStmt);

  if (!attributes.length) {
    return Promise.resolve({attributes: [], ...insertedApplicantReport});
  }

  const columns = ['applicant_report_id', 'form_field_id'];
  const options = {table: 'applicant_report_field'};
  const cs = new ColumnSet(columns, options);

  const attrs = attributes.map((form_field_id) => ({
    applicant_report_id: insertedApplicantReport.applicant_report_id,
    form_field_id,
  }));

  const attrsStmt = insert(attrs, cs) + ' RETURNING *';

  return db
    .any(attrsStmt)
    .then((attributes) => ({attributes, ...insertedApplicantReport}));
};

type DbUpdateApplicantReportParams = {
  applicant_report_id: string;
  tenant_id: string;
  attributes: string[];
  image: string;
};
export const dbUpdateApplicantReport = async ({
  applicant_report_id,
  tenant_id,
  attributes,
  image,
}: DbUpdateApplicantReportParams) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const stmt =
    'UPDATE applicant_report SET image=${image} WHERE applicant_report_id=${applicant_report_id} AND tenant_id=${tenant_id} RETURNING *';
  const updatedReport = await db.one(stmt, {
    applicant_report_id,
    image,
    tenant_id,
  });

  const delStmt =
    'DELETE FROM applicant_report_field WHERE applicant_report_id=${applicant_report_id}';
  await db.none(delStmt, {applicant_report_id});

  if (!attributes.length) {
    return Promise.resolve({attributes: [], ...updatedReport});
  }

  const columns = ['applicant_report_id', 'form_field_id'];
  const options = {table: 'applicant_report_field'};
  const cs = new ColumnSet(columns, options);

  const attrs = attributes.map((form_field_id) => ({
    applicant_report_id: applicant_report_id,
    form_field_id,
  }));

  const attrsStmt = insert(attrs, cs) + ' RETURNING *';

  return db
    .any(attrsStmt)
    .then((attributes) => ({attributes, ...updatedReport}));
};
