import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {decamelizeKeys} from 'humps';
import {Applicant} from 'domain/entities';

export const ApplicantsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const list = (params: {
    tenantId: string;
    jobId: string;
    userId: string;
    orderBy?: string;
    offset?: number;
    limit?: number;
    filter?: string;
  }): Promise<{applicants: Applicant[]; totalCount: string}> => {
    const limitQuery = (val?: number) => ({
      rawType: true,
      toPostgres: () => val ?? 'ALL',
    });

    const vals = decamelizeKeys(params) as any;

    return db
      .any(sql.list, {
        ...vals,
        limit: limitQuery(params.limit),
        offset: params.offset || 0,
        order_by: vals.order_by || null,
        filter: !vals.filter ? null : vals.filter,
      })
      .then((applicants) => {
        if (!applicants?.length) return {applicants: [], totalCount: 0};

        return {
          applicants: applicants.map(({totalCount, ...appl}) => appl),
          totalCount: applicants[0].totalCount,
        };
      });
  };

  const retrieve = (
    tenantId: string,
    applicantId: string,
  ): Promise<Applicant | null> => {
    const params = decamelizeKeys({tenantId, applicantId});
    return db.oneOrNone(sql.retrieve, params);
  };

  const create = async (params: {
    tenantId: string;
    jobId: string;
    attributes: {formFieldId: string; attributeValue: string}[];
  }): Promise<Applicant> => {
    const {insert, ColumnSet} = pgp.helpers;
    try {
      const applVals = {tenant_id: params.tenantId, job_id: params.jobId};
      const applStmt = insert(applVals, null, 'applicant') + ' RETURNING *';
      const {applicantId} = await db.one(applStmt);

      const columns = ['applicant_id', 'form_field_id', 'attribute_value'];
      const options = {table: 'applicant_attribute'};
      const cs = new ColumnSet(columns, options);
      const attrs = params.attributes.map((attribute) => ({
        ...attribute,
        applicantId,
      }));
      const attrVals = attrs.map((attr) => decamelizeKeys(attr));
      const attrStmt = insert(attrVals, cs);
      await db.any(attrStmt);

      return retrieve(params.tenantId, applicantId).then((applicant) => {
        if (!applicant) throw new Error('Did not find applicant after insert');
        return applicant;
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const del = (tenantId: string, applicantId: string): Promise<null> => {
    const stmt =
      'DELETE FROM applicant' +
      ' WHERE tenant_id=${tenant_id} AND applicant_id=${applicant_id} ';
    return db.none(stmt, {tenant_id: tenantId, applicant_id: applicantId});
  };

  const update = async (params: {
    applicantId: string;
    tenantId: string;
    jobId: string;
    attributes: {formFieldId: string; attributeValue: string}[];
  }): Promise<Applicant> => {
    const helpers = db.$config.pgp.helpers;

    const delCond = ' WHERE applicant_id=${applicant_id}';
    const delStmt = 'DELETE FROM applicant_attribute' + delCond;
    await db.none(delStmt, {applicant_id: params.applicantId});

    const columns = ['applicant_id', 'form_field_id', 'attribute_value'];
    const options = {table: 'applicant_attribute'};
    const cs = new helpers.ColumnSet(columns, options);
    const attributes = params.attributes.map((attribute) => ({
      ...attribute,
      applicantId: params.applicantId,
    }));

    const stmt = helpers.insert(
      attributes.map((attr) => decamelizeKeys(attr)),
      cs,
    );
    await db.any(stmt);

    return retrieve(params.tenantId, params.applicantId).then((applicant) => {
      if (!applicant) throw new Error('Did not find applicant after update');
      return applicant;
    });
  };

  const updateUserStatus = async (
    tenantId: string,
    applicantId: string,
    applicant_status: string,
  ) => {
    await db.none(
      'UPDATE applicant SET applicant_status=${applicant_status} WHERE tenant_id=${tenant_id} AND applicant_id=${applicant_id}',
      decamelizeKeys({tenantId, applicantId, applicant_status}),
    );

    return retrieve(tenantId, applicantId);
  };

  return {create, retrieve, update, del, list, updateUserStatus};
};
