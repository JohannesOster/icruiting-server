import {decamelizeKeys} from 'humps';
import sql from './sql';
import {ReportPrepareRow, FormSubmission as DBFormSubmission} from './types';
import {FormSubmission} from '../../../domain';
import {FormCategory} from 'modules/forms/domain';
import {DBAccess} from 'shared/infrastructure/http';
import {formSubmissionsMapper} from 'modules/formSubmissions/mappers';

export const FormSubmissionsRepository = ({db, pgp}: DBAccess) => {
  const reduceSubmission = (submission: {formFieldId: string; submissionValue: string}[]) => {
    return submission.reduce((acc, {formFieldId, submissionValue}) => {
      acc[formFieldId] = submissionValue;
      return acc;
    }, {} as any);
  };

  const formFieldCs = new pgp.helpers.ColumnSet(
    ['form_submission_id', 'form_field_id', 'submission_value'],
    {table: 'form_submission_field'},
  );

  const create = async (params: DBFormSubmission): Promise<FormSubmission> => {
    const {insert, ColumnSet} = db.$config.pgp.helpers;

    const subCS = new ColumnSet(['applicant_id', 'submitter_id', 'form_id', 'tenant_id'], {
      table: 'form_submission',
    });

    const {tenantId, applicantId, submitterId, formId} = params;
    const subParams = {tenantId, applicantId, submitterId, formId};
    const subStmt = insert(decamelizeKeys(subParams), subCS) + ' RETURNING *';
    const sub = await db.one(subStmt);

    const submissionFields = Object.entries(params.submission).map(
      ([formFieldId, submissionValue]) => ({
        formSubmissionId: sub.formSubmissionId,
        formFieldId,
        submissionValue,
      }),
    );

    const values = submissionFields.map((field) => decamelizeKeys(field));
    const fieldStmt = insert(values, formFieldCs) + ' RETURNING *';

    return db
      .any(fieldStmt)
      .then((data) => ({...sub, submission: reduceSubmission(data)}))
      .then(formSubmissionsMapper.toDomain);
  };

  const retrieve = (params: {
    formId: string;
    submitterId: string;
    applicantId: string;
    tenantId: string;
  }): Promise<FormSubmission | null> => {
    return db
      .oneOrNone(sql.retrieve, decamelizeKeys(params))
      .then((data) => {
        if (!data) return null;
        return {...data, submission: reduceSubmission(data.submission)};
      })
      .then((data) => (data ? formSubmissionsMapper.toDomain(data) : null));
  };

  const update = async (params: DBFormSubmission): Promise<FormSubmission> => {
    const selCond = ' WHERE form_submission_id=${form_submission_id} AND tenant_id=${tenant_id}';
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
      ([formFieldId, submissionValue]) => ({
        formSubmissionId: params.formSubmissionId,
        formFieldId,
        submissionValue,
      }),
    );

    const values = submissionFields.map((field) => decamelizeKeys(field));
    const fieldStmt = insert(values, formFieldCs) + ' RETURNING *';

    return db
      .any(fieldStmt)
      .then((data) => ({...sub, submission: reduceSubmission(data)}))
      .then(formSubmissionsMapper.toDomain);
  };

  const prepareReport = (
    tenantId: string,
    formCategory: FormCategory,
    jobId: string,
    submitterId?: string,
  ): Promise<ReportPrepareRow[]> => {
    return db.any(sql.prepareReport, decamelizeKeys({tenantId, formCategory, jobId, submitterId}));
  };

  const prepareTEReport = (
    tenantId: string,
    formId: FormCategory,
    jobId: string,
  ): Promise<ReportPrepareRow[]> => {
    return db.any(sql.prepareTEReport, decamelizeKeys({tenantId, formId, jobId}));
  };

  const del = (tenantId: string, formSubmissionId: string): Promise<null> => {
    return db.none(
      'DELETE FROM form_submission WHERE tenant_id=${tenant_id} AND form_submission_id=${form_submission_id}',
      decamelizeKeys({tenantId, formSubmissionId}),
    );
  };

  const bulkDel = (tenantId: string, submitterId: string): Promise<null> => {
    return db.none(
      'DELETE FROM form_submission WHERE tenant_id=${tenant_id} AND submitter_id=${submitter_id}',
      decamelizeKeys({tenantId, submitterId}),
    );
  };

  const list = (
    tenantId: string,
    jobId: string,
    formCategory: string,
  ): Promise<FormSubmission[]> => {
    return db.any(sql.list, decamelizeKeys({tenantId, jobId, formCategory})).then((rows) => {
      return rows.map((row) =>
        formSubmissionsMapper.toDomain({
          ...row,
          submission: reduceSubmission(row.submission),
        }),
      );
    });
  };

  return {
    create,
    retrieve,
    update,
    del,
    bulkDel,
    prepareReport,
    list,
    prepareTEReport,
  };
};
