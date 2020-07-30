import db from '.';

type TInsertScreeningParams = {
  submitter_id: string;
  form_id: string;
  applicant_id: string;
  submission: {[key: string]: string | number};
  comment?: string;
};
export const insertScreening = (params: TInsertScreeningParams) => {
  // make shure submissionValues are only integers
  Object.keys(params.submission).forEach((key) => {
    const numericVal = parseInt(params.submission[key].toString());
    if (!numericVal && numericVal !== 0)
      throw new Error(
        `Invalid value: ${params.submission[key]}, must be integer`,
      );
    params.submission[key] = numericVal;
  });

  const values = {...params, submission: JSON.stringify(params.submission)};
  const stmt =
    db.$config.pgp.helpers.insert(values, null, 'screening') + ' RETURNING *';
  return db.one(stmt);
};

export const selectScreening = (params: {
  submitter_id: string;
  applicant_id: string;
}) => {
  const stmt =
    'SELECT * FROM screening WHERE submitter_id=${submitter_id} AND applicant_id=${applicant_id}';
  return db.any(stmt, params);
};

export const updateScreening = (params: {
  submitter_id: string;
  applicant_id: string;
  submission?: {[key: string]: string | number};
  comment?: string;
}) => {
  const values: any = {};
  if (params.submission) values.submission = JSON.stringify(params.submission);
  if (params.comment) values.comment = params.comment;

  if (!Object.keys(values).length) {
    const stmt =
      'SELECT * FROM screening WHERE submitter_id=${submitter_id} AND applicant_id=${applicant_id}';
    return db.one(stmt, params);
  }

  const update = db.$config.pgp.helpers.update;
  const condition =
    ' WHERE submitter_id=${submitter_id} AND applicant_id=${applicant_id}';
  const returing = ' RETURNING *';
  const stmt = update(values, null, 'screening') + condition + returing;

  return db.one(stmt, params);
};
