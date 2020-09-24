import db from 'db';
import {selectFormSubmission} from './sql';
import {TFormSubmission} from './types';

export const dbInsertFormSubmission = async ({
  submission,
  applicantId,
  tenantId,
  submitterId,
  formId,
}: TFormSubmission) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const subCS = new ColumnSet(
    ['applicantId', 'submitterId', 'formId', 'tenantId'],
    {table: 'form_submission'},
  );

  const subParams = {tenantId, applicantId, submitterId, formId};
  const subStmt = insert(subParams, subCS) + ' RETURNING *';
  const sub = await db.one(subStmt);

  const fieldCS = new ColumnSet(
    ['formSubmissionId', 'formFieldId', 'submission_value'],
    {table: 'form_submission_field'},
  );

  const vals = Object.entries(submission).map(
    ([formFieldId, submission_value]) => ({
      formSubmissionId: sub.formSubmissionId,
      formFieldId,
      submission_value,
    }),
  );

  const fieldStmt = insert(vals, fieldCS) + ' RETURNING *';
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
