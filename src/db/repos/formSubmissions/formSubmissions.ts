import {IDatabase, IMain} from 'pg-promise';
import {decamelizeKeys} from 'humps';
import sql from './sql';

export type FormSubmission = {
  formSubmissionId: string;
  tenantId: string;
  applicantId: string;
  submitterId: string;
  formId: string;
  submission: {[formFieldId: string]: string};
};

export const FormSubmissionsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const reduceSubmission = (
    submission: {formFieldId: string; submissionValue: string}[],
  ) => {
    return submission.reduce((acc, {formFieldId, submissionValue}) => {
      acc[formFieldId] = submissionValue;
      return acc;
    }, {} as any);
  };

  const formFieldCs = new pgp.helpers.ColumnSet(
    ['form_submission_id', 'form_field_id', 'submission_value'],
    {table: 'form_submission_field'},
  );

  const insert = async (params: {
    tenantId: string;
    applicantId: string;
    submitterId: string;
    formId: string;
    submission: {[formFieldId: string]: string};
  }): Promise<FormSubmission> => {
    const {insert, ColumnSet} = db.$config.pgp.helpers;

    const subCS = new ColumnSet(
      ['applicant_id', 'submitter_id', 'form_id', 'tenant_id'],
      {table: 'form_submission'},
    );

    const {tenantId, applicantId, submitterId, formId} = params;
    const subParams = {tenantId, applicantId, submitterId, formId};
    const subStmt = insert(decamelizeKeys(subParams), subCS) + ' RETURNING *';
    const sub = await db.one(subStmt);

    const submissionFields = Object.entries(params.submission).map(
      ([formFieldId, submission_value]) => ({
        formSubmissionId: sub.formSubmissionId,
        formFieldId,
        submission_value,
      }),
    );

    const values = submissionFields.map((field) => decamelizeKeys(field));
    const fieldStmt = insert(values, formFieldCs) + ' RETURNING *';

    return db
      .any(fieldStmt)
      .then((data) => ({...sub, submission: reduceSubmission(data)}));
  };

  const find = (params: {
    formId: string;
    submitterId: string;
    applicantId: string;
    tenantId: string;
  }): Promise<FormSubmission | null> => {
    return db.oneOrNone(sql.find, decamelizeKeys(params)).then((data) => {
      if (!data) return data;
      return {...data, submission: reduceSubmission(data.submission)};
    });
  };

  const update = async (params: {
    tenantId: string;
    formSubmissionId: string;
    submission: {[key: string]: string | number};
  }): Promise<FormSubmission> => {
    const selCond =
      ' WHERE form_submission_id=${form_submission_id} AND tenant_id=${tenant_id}';
    const sub = await db.one(
      'SELECT * FROM form_submission' + selCond,
      decamelizeKeys({
        formSubmissionId: params.formSubmissionId,
        tenantId: params.tenantId,
      }),
    );

    await db.none(
      'DELETE FROM form_submission_field WHERE form_submission_id = $1',
      params.formSubmissionId,
    );

    const {insert} = db.$config.pgp.helpers;

    const submissionFields = Object.entries(params.submission).map(
      ([formFieldId, submission_value]) => ({
        formSubmissionId: params.formSubmissionId,
        formFieldId,
        submission_value,
      }),
    );

    const values = submissionFields.map((field) => decamelizeKeys(field));
    const fieldStmt = insert(values, formFieldCs) + ' RETURNING *';

    return db
      .any(fieldStmt)
      .then((data) => ({...sub, submission: reduceSubmission(data)}));
  };

  return {insert, find, update};
};
