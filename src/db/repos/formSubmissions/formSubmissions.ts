import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {decamelizeKeys} from 'humps';

export const FormSubmissionsRepository = (db: IDatabase<any>, pgp: IMain) => {
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

    return db.any(fieldStmt).then((data) => {
      const submission = data.reduce((acc, {formFieldId, submissionValue}) => {
        acc[formFieldId] = submissionValue;
        return acc;
      }, {});

      return {...sub, submission};
    });
  };

  return {insert};
};
