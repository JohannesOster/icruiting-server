import {IDatabase, IMain} from 'pg-promise';
import {decamelizeKeys} from 'humps';
import sql from './sql';
import {compareArrays} from '../../utils';
import {Job} from 'domain/entities';

export const JobssRepository = (db: IDatabase<any>, pgp: IMain) => {
  const {ColumnSet} = pgp.helpers;

  const jrColumnSet = new ColumnSet(
    [
      'job_requirement_id',
      'job_id',
      'requirement_label',
      {name: 'min_value', def: null},
    ],
    {table: 'job_requirement'},
  );

  const list = (tenantId: string): Promise<Job[]> => {
    return db.any(sql.list, decamelizeKeys({tenantId, jobId: null}));
  };

  const retrieve = (tenantId: string, jobId: string): Promise<Job | null> => {
    return db.oneOrNone(sql.list, decamelizeKeys({tenantId, jobId}));
  };

  const create = async (params: Job): Promise<Job> => {
    const {jobRequirements, ...job} = params;
    const {insert} = pgp.helpers;
    const stmt = insert(decamelizeKeys(job), null, 'job') + ' RETURNING *';
    const insertedJob = await db.one(stmt);

    const requirements = jobRequirements.map((req) => ({
      jobId: insertedJob.jobId,
      ...req,
    }));

    const reqVals = requirements.map((req) => decamelizeKeys(req));
    return db
      .any(insert(reqVals, jrColumnSet) + ' RETURNING *')
      .then((jobRequirements) => ({...insertedJob, jobRequirements}));
  };

  const update = async (params: Job): Promise<Job> => {
    const {tenantId, ...job} = params;
    const originalJob = await retrieve(tenantId, job.jobId);
    if (!originalJob) throw new Error('Did not find job to update');
    const {insert, update} = db.$config.pgp.helpers;

    await db.tx(async (t) => {
      const promises: Promise<any>[] = [];
      if (job.jobTitle !== originalJob.jobTitle) {
        const vals = {job_title: job.jobTitle};
        const condition = ' WHERE tenant_id=$1 AND job_id=$2';
        const stmt = update(vals, null, 'job') + condition;
        promises.push(t.none(stmt, [tenantId, job.jobId]));
      }

      const requirementsMap = compareArrays(
        job.jobRequirements,
        originalJob.jobRequirements,
        (a, b) => a.jobRequirementId === b.jobRequirementId,
      );

      /** DELETE ======================== */
      promises.concat(
        requirementsMap.secondMinusFirst.map(async ({jobRequirementId}) => {
          return t.none(
            'DELETE FROM job_requirement WHERE job_requirement_id=$1',
            jobRequirementId,
          );
        }),
      );

      /** INSERT ========================= */
      if (requirementsMap.firstMinusSecond.length) {
        const requirements = requirementsMap.firstMinusSecond.map((req) => ({
          jobId: job.jobId,
          ...req,
        }));

        const reqVals = requirements.map((req) => decamelizeKeys(req));
        const reqStmt = insert(reqVals, jrColumnSet);

        promises.push(t.none(reqStmt));
      }

      /** UPDATE ========================== */
      if (requirementsMap.intersection.length) {
        const csUpdate = new ColumnSet(
          [
            '?job_requirement_id',
            'requirement_label',
            {name: 'min_value', def: null, cast: 'numeric'},
          ],
          {table: 'job_requirement'},
        );

        const values = decamelizeKeys(requirementsMap.intersection);
        const updateStmt =
          update(values, csUpdate) +
          ' WHERE v.job_requirement_id::UUID = t.job_requirement_id';
        promises.push(t.any(updateStmt));
      }
      return t.batch(promises);
    });

    return retrieve(tenantId, job.jobId).then((job) => {
      if (!job) throw new Error('Did not find job after update');
      return job;
    });
  };

  const del = (tenantId: string, jobId: string): Promise<null> => {
    return db.none(
      'DELETE FROM job WHERE tenant_id=${tenant_id} AND job_id=${job_id}',
      decamelizeKeys({tenantId, jobId}),
    );
  };

  const createReport = async (
    tenantId: string,
    jobId: string,
    formFields: string[],
  ) => {
    const {insert} = pgp.helpers;
    const formFieldIds = formFields.map((formFieldId) =>
      decamelizeKeys({jobId, tenantId, formFieldId}),
    );

    const table = {table: 'report_field'};
    const cs = new ColumnSet(['job_id', 'tenant_id', 'form_field_id'], table);

    return db
      .any(insert(formFieldIds, cs))
      .then(() => retrieveReport(tenantId, jobId));
  };

  const retrieveReport = async (tenantId: string, jobId: string) => {
    return db.oneOrNone(sql.retrieveReport, decamelizeKeys({tenantId, jobId}));
  };

  const updateReport = async (
    tenantId: string,
    jobId: string,
    formFields: string[],
  ) => {
    await delReport(tenantId, jobId);
    return createReport(tenantId, jobId, formFields);
  };

  const delReport = async (tenantId: string, jobId: string) => {
    return db.none(
      'DELETE FROM report_field WHERE tenant_id=$1 AND job_id=$2',
      [tenantId, jobId],
    );
  };

  return {
    create,
    retrieve,
    update,
    del,
    list,
    createReport,
    retrieveReport,
    updateReport,
    delReport,
  };
};
