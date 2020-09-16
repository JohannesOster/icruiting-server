import db from 'db';
import {selectJobs as selectJobsSQL, selectJob as selectJobSQL} from './sql';
import {TJob} from './types';

export const dbInsertJob = async ({job_requirements, ...job}: TJob) => {
  const helpers = db.$config.pgp.helpers;

  const insertJobStmt = helpers.insert(job, null, 'job') + ' RETURNING *';
  const insertedJob = await db.one(insertJobStmt);

  const cs = new helpers.ColumnSet(
    ['job_id', 'tenant_id', 'requirement_label'],
    {table: 'job_requirement'},
  );

  const requirements = job_requirements.map((req) => ({
    job_id: insertedJob.job_id,
    tenant_id: insertedJob.tenant_id,
    ...req,
  }));

  const reqStmt = helpers.insert(requirements, cs) + ' RETURNING *';

  return db
    .any(reqStmt)
    .then((job_requirements) => ({job_requirements, ...insertedJob}));
};

export const dbSelectJobs = (tenant_id: string) => {
  return db.any(selectJobsSQL, {tenant_id});
};

export const dbSelectJob = (job_id: string, tenant_id: string) => {
  return db.one(selectJobSQL, {job_id, tenant_id});
};

export const dbUpdateJob = (job_id: string, tenant_id: string, body: TJob) => {
  return db
    .tx(async (t) => {
      const helpers = db.$config.pgp.helpers;

      /* Update job title or query job */
      const vals = {job_title: body.job_title};
      const stmt = helpers.update(vals, null, 'job') + ' WHERE job_id=$1';
      await t.none(stmt, job_id);

      await t.any('SET CONSTRAINTS job_requirement_id_fk DEFERRED');
      await t.none('DELETE FROM job_requirement WHERE job_id=$1', job_id);

      const rawText = (text: string) => ({
        toPostgres: () => text,
        rawType: true,
      });

      const cs = new helpers.ColumnSet(
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

      const reqStmt = helpers.insert(requirements, cs);
      await t.none(reqStmt);
    })
    .then(async () => await dbSelectJob(job_id, tenant_id));
};

export const dbDeleteJob = (job_id: string, tenant_id: string) => {
  const stmt =
    'DELETE FROM job WHERE job_id=${job_id} AND tenant_id=${tenant_id}';
  return db.none(stmt, {job_id, tenant_id});
};
