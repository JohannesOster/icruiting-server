import db from 'db';
import {selectJobs as selectJobsSQL} from './sql';
import {TJob} from './types';

export const dbInsertJob = async ({job_requirements, ...job}: TJob) => {
  const helpers = db.$config.pgp.helpers;

  const insertJobStmt = helpers.insert(job, null, 'job') + ' RETURNING *';
  const insertedJob = await db.one(insertJobStmt);

  const cs = new helpers.ColumnSet(
    ['job_id', 'organization_id', 'requirement_label'],
    {table: 'job_requirement'},
  );

  const requirements = job_requirements.map((req) => ({
    job_id: insertedJob.job_id,
    organization_id: insertedJob.organization_id,
    requirement_label: req.requirement_label,
  }));

  const reqStmt = helpers.insert(requirements, cs) + ' RETURNING *';

  return db
    .any(reqStmt)
    .then((job_requirements) => ({job_requirements, ...insertedJob}));
};

export const dbSelectJobs = (organization_id: string) => {
  return db.any(selectJobsSQL, {organization_id});
};

export const dbUpdateJob = (job_id: string, body: any) => {
  return db
    .tx((t) => {
      const promises = [];
      const update = db.$config.pgp.helpers.update;

      /* Update job title or query job */
      if (body.job_title) {
        const vals = {job_title: body.job_title};
        const stmt = update(vals, null, 'job') + ' WHERE job_id=$1 RETURNING *';
        promises.push(t.one(stmt, job_id));
      } else {
        const stmt = 'SELECT * FROM job WHERE job_id=$1';
        promises.push(t.one(stmt, job_id));
      }

      (body.job_requirements || []).forEach((req: any) => {
        const vals = {requirement_label: req.requirement_label};
        const condition = ' WHERE job_requirement_id=$1';
        const stmt = update(vals, null, 'job_requirement') + condition;
        promises.push(t.none(stmt, req.job_requirement_id));
      });

      return t.batch(promises);
    })
    .then(async (result) => {
      // to send all requirements as response a new select stmt has to be made
      const stmt = 'SELECT * FROM job_requirement WHERE job_id=$1';
      const job_requirements = await db.any(stmt, job_id);
      return {...result[0], job_requirements};
    });
};
