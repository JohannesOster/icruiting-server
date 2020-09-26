import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {decamelizeKeys} from 'humps';
import {String} from 'aws-sdk/clients/cloudhsm';

export const ApplicantsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const findAll = (tenantId: string, jobId: string, userId: string) => {
    const params = decamelizeKeys({tenantId, jobId, userId});
    return db.any(sql.all, params);
  };

  const find = (tenantId: string, applicantId: string) => {
    const params = decamelizeKeys({tenantId, applicantId});
    return db.oneOrNone(sql.find, params);
  };

  const insert = async (params: {
    tenantId: string;
    jobId: string;
    attributes: {formFieldId: string; attributeValue: string}[];
  }) => {
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

      return find(params.tenantId, applicantId);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const remove = (tenantId: string, applicantId: string) => {
    const stmt =
      'DELETE FROM applicant' +
      ' WHERE tenant_id=${tenant_id} AND applicant_id=${applicant_id} ';
    return db.none(stmt, {tenant_id: tenantId, applicant_id: applicantId});
  };

  const update = async (params: {
    applicantId: String;
    jobId: string;
    attributes: {formFieldId: string; attributeValue: string}[];
  }) => {
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
    return db.any(stmt);
  };

  return {findAll, find, insert, remove, update};
};