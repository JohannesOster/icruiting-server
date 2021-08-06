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
    filter?: {[attribute: string]: {eq: string}};
  }): Promise<{applicants: Applicant[]; totalCount: string}> => {
    const limitQuery = (val?: number) => ({
      rawType: true,
      toPostgres: () => val ?? 'ALL',
    });

    let filter_overall = '';
    if (params.filter && params.filter['Bewerber:innenstatus']) {
      filter_overall = pgp.as.format(
        'AND applicant.applicant_status::TEXT = $1',
        params.filter['Bewerber:innenstatus'].eq,
      );

      delete params.filter['Bewerber:innenstatus'];
    }

    let filter_attributes = '';
    Object.entries(params.filter || {}).forEach(([attribute, {eq}], idx) => {
      if (idx === 0) filter_attributes = 'WHERE ';
      else filter_attributes += ' AND ';
      filter_attributes += pgp.as.format(
        `LOWER(attributes->>'$1:value') LIKE CONCAT('%',LOWER('$2:value'),'%')`,
        [attribute, eq],
      );
    });

    return db
      .any(sql.list, {
        ...decamelizeKeys(params),
        limit: limitQuery(params.limit),
        offset: params.offset || 0,
        order_by: params.orderBy || null,
        filter_attributes,
        filter_overall,
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

  const updateApplicantStatus = async (
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

  return {create, retrieve, update, del, list, updateApplicantStatus};
};
