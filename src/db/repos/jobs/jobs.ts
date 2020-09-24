import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {rawText} from '../../utils';
import {decamelizeKeys} from 'humps';

export const JobssRepository = (db: IDatabase<any>, pgp: IMain) => {
  const {ColumnSet} = pgp.helpers;

  const jrColumnSet = new ColumnSet(
    [
      {
        name: 'job_requirement_id',
        def: () => rawText('uuid_generate_v4()'),
      },
      'job_id',
      'tenant_id',
      'requirement_label',
    ],
    {table: 'job_requirement'},
  );

  const all = (tenantId: string) => {
    return db.any(sql.all, {tenant_id: tenantId});
  };

  const find = (tenantId: string, jobId: string) => {
    return db.oneOrNone(sql.find, {tenant_id: tenantId, job_id: jobId});
  };

  const insert = async (values: {
    jobTitle: string;
    tenantId: string;
    jobRequirements: Array<{
      requirementLabel: string;
    }>;
  }) => {
    const {jobRequirements, ...job} = values;
    const {insert} = pgp.helpers;
    const jobVals = decamelizeKeys(job);
    const insertedJob = await db.one(
      insert(jobVals, null, 'job') + 'RETURNING *',
    );

    const requirements = jobRequirements.map((req) => ({
      jobId: insertedJob.jobId,
      tenantId: insertedJob.tenantId,
      ...req,
    }));

    const reqVals = requirements.map((req) => decamelizeKeys(req));
    return db
      .any(insert(reqVals, jrColumnSet) + ' RETURNING *')
      .then((jobRequirements) => ({...insertedJob, jobRequirements}));
  };

  const update = (
    tenantId: string,
    job: {
      jobId: string;
      jobTitle: string;
      jobRequirements: {
        requirementLabel: string;
      }[];
    },
  ) => {
    return db
      .tx(async (t) => {
        const {insert, update} = db.$config.pgp.helpers;
        const vals = {job_title: job.jobTitle};
        const stmt = update(vals, null, 'job') + ' WHERE job_id=$1';
        await t.none(stmt, job.jobId);

        await t.any('SET CONSTRAINTS job_requirement_id_fk DEFERRED');
        await t.none('DELETE FROM job_requirement WHERE job_id=$1', job.jobId);

        const requirements = job.jobRequirements.map((req: any) => {
          const tmp: any = {jobId: job.jobId, tenantId, ...req};
          if (!tmp.jobRequirementId) delete tmp.jobRequirementId; // filter out empty strings
          return tmp;
        });

        const reqVals = requirements.map((req) => decamelizeKeys(req));
        const reqStmt = insert(reqVals, jrColumnSet);
        await t.none(reqStmt);
      })
      .then(async () => await find(tenantId, job.jobId));
  };

  const remove = (tenantId: string, jobId: string) => {
    return db.none(
      'DELETE FROM job WHERE tenant_id=${tenant_id} AND job_id=${job_id}',
      {tenant_id: tenantId, job_id: jobId},
    );
  };

  return {all, find, insert, update, remove};
};
