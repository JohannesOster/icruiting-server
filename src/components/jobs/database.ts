import db from 'db';
import {rawText} from 'db/setup';
import {selectJobs as selectJobsSQL, selectJob as selectJobSQL} from './sql';
import {TJob} from './types';

export const dbInsertJob = async ({job_requirements, ...job}: TJob) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const insertJobStmt = insert(job, null, 'job') + ' RETURNING *';
  const insertedJob = await db.one(insertJobStmt);

  const columns = ['job_id', 'tenant_id', 'requirement_label'];
  const options = {table: 'job_requirement'};
  const cs = new ColumnSet(columns, options);

  const requirements = job_requirements.map((req) => ({
    job_id: insertedJob.job_id,
    tenant_id: insertedJob.tenant_id,
    ...req,
  }));

  const reqStmt = insert(requirements, cs) + ' RETURNING *';

  return db
    .any(reqStmt)
    .then((job_requirements) => ({job_requirements, ...insertedJob}));
};

export const dbSelectJobs = (
  tenant_id: string,
  job_id: string | null = null,
) => {
  return db.any(selectJobsSQL, {tenant_id, job_id});
};

export const dbSelectJob = (job_id: string, tenant_id: string) => {
  return db.any(selectJobsSQL, {tenant_id, job_id}).then((resp) => resp[0]);
};

export const dbUpdateJob = (job_id: string, tenant_id: string, body: TJob) => {
  return db
    .tx(async (t) => {
      const {insert, update, ColumnSet} = db.$config.pgp.helpers;

      const vals = {job_title: body.job_title};
      const stmt = update(vals, null, 'job') + ' WHERE job_id=$1';
      await t.none(stmt, job_id);

      await t.any('SET CONSTRAINTS job_requirement_id_fk DEFERRED');
      await t.none('DELETE FROM job_requirement WHERE job_id=$1', job_id);

      const cs = new ColumnSet(
        [
          {
            name: 'job_requirement_id',
            def: () => rawText('uuid_generate_v4()'),
          }, // insert job_requirement_id to make shure already existsing form items "only get updated"
          'job_id',
          'tenant_id',
          'requirement_label',
        ],
        {table: 'job_requirement'},
      );

      const requirements = body.job_requirements.map((req: any) => {
        const tmp: any = {job_id, tenant_id, ...req};
        if (!tmp.job_requirement_id) delete tmp.job_requirement_id; // filter out empty strings
        return tmp;
      });

      const reqStmt = insert(requirements, cs);
      await t.none(reqStmt);
    })
    .then(async () => await dbSelectJob(job_id, tenant_id));
};

export const dbDeleteJob = (job_id: string, tenant_id: string) => {
  const stmt =
    'DELETE FROM job WHERE job_id=${job_id} AND tenant_id=${tenant_id}';
  return db.none(stmt, {job_id, tenant_id});
};

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
