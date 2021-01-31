import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {rawText} from '../../utils';
import {decamelizeKeys} from 'humps';

export type JobRequirement = {
  jobRequirementId: string;
  jobId: string;
  requirementLabel: string;
  minValue?: string;
};

export type Job = {
  tenantId: string;
  jobId: string;
  jobTitle: string;
  createdAt: string;
  jobRequirements: JobRequirement[];
};

export const JobssRepository = (db: IDatabase<any>, pgp: IMain) => {
  const {ColumnSet} = pgp.helpers;

  const jrColumnSet = new ColumnSet(
    [
      {
        name: 'job_requirement_id',
        def: () => rawText('uuid_generate_v4()'),
      },
      'job_id',
      'requirement_label',
      {name: 'min_value', def: null},
    ],
    {table: 'job_requirement'},
  );

  const list = (tenantId: string): Promise<Job[]> => {
    return db.any(sql.retrieve, {tenant_id: tenantId, job_id: null});
  };

  const retrieve = (tenantId: string, jobId: string): Promise<Job | null> => {
    return db.oneOrNone(sql.retrieve, {tenant_id: tenantId, job_id: jobId});
  };

  const create = async (values: {
    jobTitle: string;
    tenantId: string;
    jobRequirements: {
      requirementLabel: string;
      minValue?: number;
    }[];
  }): Promise<Job> => {
    const {jobRequirements, ...job} = values;
    const {insert} = pgp.helpers;
    const jobVals = decamelizeKeys(job);
    const stmt = insert(jobVals, null, 'job') + 'RETURNING *';
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

  const update = async (
    tenantId: string,
    job: {
      jobId: string;
      jobTitle: string;
      jobRequirements: {
        requirementLabel: string;
        minValue?: number;
      }[];
    },
  ): Promise<Job> => {
    await db.tx(async (t) => {
      const {insert, update} = db.$config.pgp.helpers;
      const vals = {job_title: job.jobTitle};
      const stmt = update(vals, null, 'job') + ' WHERE job_id=$1';
      await t.none(stmt, job.jobId);

      await t.any('SET CONSTRAINTS job_requirement_id_fk DEFERRED');
      await t.none('DELETE FROM job_requirement WHERE job_id=$1', job.jobId);

      const requirements = job.jobRequirements.map((req: any) => {
        const tmp: any = {jobId: job.jobId, ...req};
        if (!tmp.jobRequirementId) delete tmp.jobRequirementId; // filter out empty strings
        return tmp;
      });

      const reqVals = requirements.map((req) => decamelizeKeys(req));
      const reqStmt = insert(reqVals, jrColumnSet);
      await t.none(reqStmt);
    });

    return retrieve(tenantId, job.jobId).then((job) => {
      if (!job) throw new Error('Did not find job after update');
      return job;
    });
  };

  const del = (tenantId: string, jobId: string): Promise<null> => {
    return db.none(
      'DELETE FROM job WHERE tenant_id=${tenant_id} AND job_id=${job_id}',
      {tenant_id: tenantId, job_id: jobId},
    );
  };

  return {create, retrieve, update, del, list};
};
