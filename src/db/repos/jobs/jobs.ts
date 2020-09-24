import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {rawText} from '../../utils';

export const JobssRepository = (db: IDatabase<any>, pgp: IMain) => {
  const {ColumnSet} = pgp.helpers;

  const jrColumnSet = new ColumnSet(
    [
      {
        name: 'jobRequirementId',
        def: () => rawText('uuid_generate_v4()'),
      },
      'jobId',
      'tenantId',
      'requirementLabel',
    ],
    {table: 'job_requirement'},
  );

  const all = (tenantId: string) => {
    return db.many(sql.all, {tenantId});
  };

  const find = (tenantId: string, jobId: string) => {
    return db.oneOrNone(sql.find, {tenantId, jobId});
  };

  const insert = async (values: {
    jobTitle: string;
    tenantId: string;
    jobRequirements: Array<{
      requirementLabel: string;
    }>;
  }) => {
    const {jobRequirements, ...job} = values;
    const {insert, ColumnSet} = pgp.helpers;
    const insertedJob = await db.one(insert(job, null, 'job') + 'RETURNING *');

    const requirements = jobRequirements.map((req) => ({
      jobId: insertedJob.jobId,
      tenantId: insertedJob.tenantId,
      ...req,
    }));

    return db
      .any(insert(requirements, jrColumnSet) + ' RETURNING *')
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
        const {insert, update, ColumnSet} = db.$config.pgp.helpers;
        const vals = {jobTitle: job.jobTitle};
        const stmt = update(vals, null, 'job') + ' WHERE jobId=$1';
        await t.none(stmt, job.jobId);

        await t.any('SET CONSTRAINTS jobRequirementId_fk DEFERRED');
        await t.none('DELETE FROM job_requirement WHERE jobId=$1', job.jobId);

        const requirements = job.jobRequirements.map((req: any) => {
          const tmp: any = {jobId: job.jobId, tenantId, ...req};
          if (!tmp.jobRequirementId) delete tmp.jobRequirementId; // filter out empty strings
          return tmp;
        });

        const reqStmt = insert(requirements, jrColumnSet);
        await t.none(reqStmt);
      })
      .then(async () => await find(tenantId, job.jobId));
  };

  const remove = (tenantId: string, jobId: string) => {
    return db.none(
      'DELETE FROM job WHERE tenantId=${tenantId} AND jobId=${jobId}',
      {tenantId, jobId},
    );
  };

  return {all, find, insert, update, remove};
};
