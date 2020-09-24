import db from 'db';
import {selectFormSubmission} from './sql';
import {TFormSubmission} from './types';

export const dbInsertFormSubmission = async ({
  submission,
  applicant_id,
  tenant_id,
  submitter_id,
  form_id,
}: TFormSubmission) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const subCS = new ColumnSet(
    ['applicant_id', 'submitter_id', 'form_id', 'tenant_id'],
    {table: 'form_submission'},
  );

  const subParams = {tenant_id, applicant_id, submitter_id, form_id};
  const subStmt = insert(subParams, subCS) + ' RETURNING *';
  const sub = await db.one(subStmt);

  const fieldCS = new ColumnSet(
    ['form_submission_id', 'form_field_id', 'submission_value'],
    {table: 'form_submission_field'},
  );

  const vals = Object.entries(submission).map(
    ([form_field_id, submission_value]) => ({
      form_submission_id: sub.form_submission_id,
      form_field_id,
      submission_value,
    }),
  );

  const fieldStmt = insert(vals, fieldCS) + ' RETURNING *';
  return db.any(fieldStmt).then((submission) => ({
    ...sub,
    submission: submission.reduce((acc, {form_field_id, submission_value}) => {
      acc[form_field_id] = submission_value;
      return acc;
    }, {}),
  }));
};

export const dbUpdateFormSubmission = async (params: {
  tenant_id: string;
  form_submission_id: string;
  submission: {[key: string]: string | number};
}) => {
  const selCond =
    ' WHERE form_submission_id=${form_submission_id} AND tenant_id=${tenant_id}';
  const sub = await db.one('SELECT * FROM form_submission' + selCond, {
    form_submission_id: params.form_submission_id,
    tenant_id: params.tenant_id,
  });

  const {update, ColumnSet} = db.$config.pgp.helpers;
  const cs = new ColumnSet(
    ['?form_submission_id', '?form_field_id', 'submission_value'],
    {table: 'form_submission_field'},
  );
  const vals = Object.entries(params.submission).map(
    ([form_field_id, submission_value]) => ({
      form_submission_id: params.form_submission_id,
      form_field_id,
      submission_value,
    }),
  );
  const stmt =
    update(vals, cs) +
    ' WHERE v.form_submission_id::uuid = t.form_submission_id::uuid AND v.form_field_id::uuid = t.form_field_id::uuid' +
    ' RETURNING *';
  return db.any(stmt).then((submission) => ({
    ...sub,
    submission: submission.reduce((acc, {form_field_id, submission_value}) => {
      acc[form_field_id] = submission_value;
      return acc;
    }, {}),
  }));
};

export const dbSelectFormSubmission = (params: {
  form_id: string;
  submitter_id: string;
  applicant_id: string;
  tenant_id: string;
}) => {
  return db.any(selectFormSubmission, params).then((resp) => resp[0]);
};
