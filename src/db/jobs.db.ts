import db from '.';
import {selectJobs as selectJobsSQL} from './sql';

interface inserJobParams {
  job_title: string;
  organization_id: string;
  job_requirements: Array<{requirement_label: string}>;
}
export const insertJob = (params: inserJobParams) => {
  const job = {
    job_title: params.job_title,
    organization_id: params.organization_id,
  };
  const insertJobStmt =
    db.$config.pgp.helpers.insert(job, null, 'job') + ' RETURNING *';

  return db.one(insertJobStmt).then((insertedJob) => {
    const cs = new db.$config.pgp.helpers.ColumnSet(
      ['job_id', 'requirement_label'],
      {table: 'job_requirement'},
    );

    const values = params.job_requirements.map((requirement) => ({
      job_id: insertedJob.job_id,
      requirement_label: requirement.requirement_label,
    }));

    const stmt = db.$config.pgp.helpers.insert(values, cs) + ' RETURNING *';

    return db.any(stmt).then((job_requirements) => {
      return {job_requirements, ...insertedJob};
    });
  });
};

export const selectJobs = (organization_id: string) => {
  return db.any(selectJobsSQL, {organization_id});
};

export const updateJob = (job_id: string, body: any) => {
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
