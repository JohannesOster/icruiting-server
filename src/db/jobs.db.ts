import db from '.';

interface inserJobParams {
  job_title: string;
  organization_id: string;
  requirements: [{requirement_label: string}];
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

    const values = params.requirements.map((requirement) => ({
      job_id: insertedJob.job_id,
      requirement_label: requirement.requirement_label,
    }));

    const stmt = db.$config.pgp.helpers.insert(values, cs) + ' RETURNING *';

    return db.any(stmt).then((requirements) => {
      return {requirements, ...insertedJob};
    });
  });
};
