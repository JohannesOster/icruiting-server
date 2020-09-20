import db from 'db';
import {TFormSubmission} from './types';

export const dbInsertFormSubmission = (submission: TFormSubmission) => {
  const {insert, ColumnSet} = db.$config.pgp.helpers;

  const cs = new ColumnSet(
    [
      'applicant_id',
      'submitter_id',
      'form_id',
      'tenant_id',
      {name: 'submission', mod: ':json', cast: 'jsonb'},
      {name: 'comment', def: null},
    ],
    {table: 'form_submission'},
  );

  const stmt = insert(submission, cs) + ' RETURNING *';

  return db.one(stmt);
};

export const dbUpdateFormSubmission = (params: {
  submitter_id: string;
  applicant_id: string;
  tenant_id: string;
  submission?: {[key: string]: string | number};
  comment?: string;
}) => {
  const condition =
    ' WHERE submitter_id=${submitter_id} ' +
    'AND applicant_id=${applicant_id} ' +
    'AND form_id=${form_id} ' +
    'AND tenant_id=${tenant_id}';

  if (!params.submission && !params.comment) {
    return db.one('SELECT * FROM form_submission' + condition, params);
  }

  const {update, ColumnSet} = db.$config.pgp.helpers;
  const cs = new ColumnSet(
    [
      {
        name: 'submission',
        mod: ':json',
        cast: 'jsonb',
        skip: () => !!!params.submission,
      },
      {name: 'comment', skip: () => !!!params.comment},
    ],
    {table: 'form_submission'},
  );

  const stmt = update(params, cs) + condition + ' RETURNING *';

  return db.one(stmt, params);
};

export const dbSelectFormSubmission = (params: {
  form_id: string;
  submitter_id: string;
  applicant_id: string;
  tenant_id: string;
}) => {
  const condition =
    ' WHERE submitter_id=${submitter_id} ' +
    'AND applicant_id=${applicant_id} ' +
    'AND form_id=${form_id} ' +
    'AND tenant_id=${tenant_id}';

  return db.one('SELECT * FROM form_submission' + condition, params);
};
