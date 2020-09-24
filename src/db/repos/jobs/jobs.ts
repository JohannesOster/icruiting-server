import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {rawText} from '../../utils';

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

  const all = (tenant_id: string) => {
    return db.many(sql.all, {tenant_id});
  };

  const find = (tenant_id: string, job_id: string) => {
    return db.oneOrNone(sql.find, {tenant_id, job_id});
  };

  const insert = async (values: {
    job_title: string;
    tenant_id: string;
    job_requirements: Array<{
      requirement_label: string;
    }>;
  }) => {
    const {job_requirements, ...job} = values;
    const {insert, ColumnSet} = pgp.helpers;
    const insertedJob = await db.one(insert(job, null, 'job') + 'RETURNING *');

    const requirements = job_requirements.map((req) => ({
      job_id: insertedJob.job_id,
      tenant_id: insertedJob.tenant_id,
      ...req,
    }));

    return db
      .any(insert(requirements, jrColumnSet) + ' RETURNING *')
      .then((job_requirements) => ({...insertedJob, job_requirements}));
  };

  const update = (
    tenant_id: string,
    job: {
      job_id: string;
      job_title: string;
      job_requirements: {
        requirement_label: string;
      }[];
    },
  ) => {
    return db
      .tx(async (t) => {
        const {insert, update, ColumnSet} = db.$config.pgp.helpers;
        const vals = {job_title: job.job_title};
        const stmt = update(vals, null, 'job') + ' WHERE job_id=$1';
        await t.none(stmt, job.job_id);

        await t.any('SET CONSTRAINTS job_requirement_id_fk DEFERRED');
        await t.none('DELETE FROM job_requirement WHERE job_id=$1', job.job_id);

        const requirements = job.job_requirements.map((req: any) => {
          const tmp: any = {job_id: job.job_id, tenant_id, ...req};
          if (!tmp.job_requirement_id) delete tmp.job_requirement_id; // filter out empty strings
          return tmp;
        });

        const reqStmt = insert(requirements, jrColumnSet);
        await t.none(reqStmt);
      })
      .then(async () => await find(tenant_id, job.job_id));
  };

  const remove = (tenant_id: string, job_id: string) => {
    return db.none(
      'DELETE FROM job WHERE tenant_id=${tenant_id} AND job_id=${job_id}',
      {tenant_id, job_id},
    );
  };

  return {all, find, insert, update, remove};
};
