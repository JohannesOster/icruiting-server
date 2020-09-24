import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';

export const JobssRepository = (db: IDatabase<any>, pgp: IMain) => ({
  insert: async (values: {
    job_title: string;
    tenant_id: string;
    job_requirements: Array<{
      requirement_label: string;
    }>;
  }) => {
    const {job_requirements, ...job} = values;
    const {insert, ColumnSet} = pgp.helpers;
    const insertedJob = await db.one(insert(job, null, 'job') + 'RETURNING *');

    const columns = ['job_id', 'tenant_id', 'requirement_label'];
    const options = {table: 'job_requirement'};
    const cs = new ColumnSet(columns, options);
    const requirements = job_requirements.map((req) => ({
      job_id: insertedJob.job_id,
      tenant_id: insertedJob.tenant_id,
      ...req,
    }));

    return db
      .any(insert(requirements, cs) + ' RETURNING *')
      .then((job_requirements) => ({...insertedJob, job_requirements}));
  },
  all: (tenant_id: string) => {
    return db.many(sql.all, {tenant_id});
  },
  find: (tenant_id: string, job_id: string) => {
    return db.oneOrNone(sql.find, {tenant_id, job_id});
  },
});
