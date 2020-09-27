import {IDatabase, IMain} from 'pg-promise';
import {decamelizeKeys} from 'humps';
import sql from './sql';

export const FormSubmissionsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const reduceSubmission = (
    submission: {formFieldId: string; submissionValue: string}[],
  ) => {
    return submission.reduce((acc, {formFieldId, submissionValue}) => {
      acc[formFieldId] = submissionValue;
      return acc;
    }, {} as any);
  };

  const insert = async (params: {
    tenantId: string;
    applicantId: string;
    submitterId: string;
    formId: string;
    submission: {[formFieldId: string]: string};
  }) => {
    const {insert, ColumnSet} = db.$config.pgp.helpers;

    const subCS = new ColumnSet(
      ['applicant_id', 'submitter_id', 'form_id', 'tenant_id'],
      {table: 'form_submission'},
    );

    const {tenantId, applicantId, submitterId, formId} = params;
    const subParams = {tenantId, applicantId, submitterId, formId};
    const subStmt = insert(decamelizeKeys(subParams), subCS) + ' RETURNING *';
    const sub = await db.one(subStmt);

    const fieldCS = new ColumnSet(
      ['form_submission_id', 'form_field_id', 'submission_value'],
      {table: 'form_submission_field'},
    );

    const submissionFields = Object.entries(params.submission).map(
      ([formFieldId, submission_value]) => ({
        formSubmissionId: sub.formSubmissionId,
        formFieldId,
        submission_value,
      }),
    );

    const values = submissionFields.map((field) => decamelizeKeys(field));
    const fieldStmt = insert(values, fieldCS) + ' RETURNING *';

    return db
      .any(fieldStmt)
      .then((data) => ({...sub, submission: reduceSubmission(data)}));
  };

  const find = (params: {
    formId: string;
    submitterId: string;
    applicantId: string;
    tenantId: string;
  }) => {
    return db.oneOrNone(sql.find, decamelizeKeys(params)).then((data) => {
      if (!data) return data;
      return {...data, submission: reduceSubmission(data.submission)};
    });
  };

  const update = async (params: {
    tenantId: string;
    formSubmissionId: string;
    submission: {[key: string]: string | number};
  }) => {
    const selCond =
      ' WHERE form_submission_id=${form_submission_id} AND tenant_id=${tenant_id}';
    const sub = await db.one(
      'SELECT * FROM form_submission' + selCond,
      decamelizeKeys({
        formSubmissionId: params.formSubmissionId,
        tenantId: params.tenantId,
      }),
    );

    const {update, ColumnSet} = db.$config.pgp.helpers;
    const cs = new ColumnSet(
      ['?form_submission_id', '?form_field_id', 'submission_value'],
      {table: 'form_submission_field'},
    );
    const submissionFields = Object.entries(params.submission).map(
      ([formFieldId, submissionValue]) => ({
        formSubmissionId: params.formSubmissionId,
        formFieldId,
        submissionValue: submissionValue.toString(), // if values do not have same typ pg-promise update fails
      }),
    );

    const vals = submissionFields.map((val) => decamelizeKeys(val));
    const stmt =
      update(vals, cs) +
      ' WHERE v.form_submission_id::uuid = t.form_submission_id AND v.form_field_id::uuid = t.form_field_id' +
      ' RETURNING *';

    return db
      .any(stmt)
      .then((data) => ({...sub, submission: reduceSubmission(data)}));
  };

  return {insert, find, update};
};
