import db from 'db';
import {selectFormSubmission} from './sql';
import {TFormSubmission} from './types';
import {decamelizeKeys} from 'humps';

export const dbInsertFormSubmission = async ({
  submission,
  applicantId,
  tenantId,
  submitterId,
  formId,
}: TFormSubmission) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const subCS = new ColumnSet(
    ['applicant_id', 'submitter_id', 'form_id', 'tenant_id'],
    {table: 'form_submission'},
  );

  const subParams = {tenantId, applicantId, submitterId, formId};
  const subStmt = insert(decamelizeKeys(subParams), subCS) + ' RETURNING *';
  const sub = await db.one(subStmt);

  const fieldCS = new ColumnSet(
    ['form_submission_id', 'form_field_id', 'submission_value'],
    {table: 'form_submission_field'},
  );

  const vals = Object.entries(submission).map(
    ([formFieldId, submission_value]) => ({
      formSubmissionId: sub.formSubmissionId,
      formFieldId,
      submission_value,
    }),
  );

  const fieldStmt =
    insert(
      vals.map((val) => decamelizeKeys(val)),
      fieldCS,
    ) + ' RETURNING *';
  return db.any(fieldStmt).then((submission) => ({
    ...sub,
    submission: submission.reduce((acc, {formFieldId, submission_value}) => {
      acc[formFieldId] = submission_value;
      return acc;
    }, {}),
  }));
};

export const dbUpdateFormSubmission = async (params: {
  tenantId: string;
  formSubmissionId: string;
  submission: {[key: string]: string | number};
}) => {
  const selCond =
    ' WHERE formSubmissionId=${formSubmissionId} AND tenantId=${tenantId}';
  const sub = await db.one('SELECT * FROM form_submission' + selCond, {
    formSubmissionId: params.formSubmissionId,
    tenantId: params.tenantId,
  });

  const {update, ColumnSet} = db.$config.pgp.helpers;
  const cs = new ColumnSet(
    ['?formSubmissionId', '?formFieldId', 'submission_value'],
    {table: 'form_submission_field'},
  );
  const vals = Object.entries(params.submission).map(
    ([formFieldId, submission_value]) => ({
      formSubmissionId: params.formSubmissionId,
      formFieldId,
      submission_value,
    }),
  );
  const stmt =
    update(vals, cs) +
    ' WHERE v.formSubmissionId::uuid = t.formSubmissionId::uuid AND v.formFieldId::uuid = t.formFieldId::uuid' +
    ' RETURNING *';
  return db.any(stmt).then((submission) => ({
    ...sub,
    submission: submission.reduce((acc, {formFieldId, submission_value}) => {
      acc[formFieldId] = submission_value;
      return acc;
    }, {}),
  }));
};

export const dbSelectFormSubmission = (params: {
  formId: string;
  submitterId: string;
  applicantId: string;
  tenantId: string;
}) => {
  return db.any(selectFormSubmission, params).then((resp) => resp[0]);
};
