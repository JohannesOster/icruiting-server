import db from '.';

type insertScreeningParams = {
  submitter_id: string;
  form_id: string;
  applicant_id: string;
  values: {[key: string]: string | number};
};
export const insertScreening = (params: insertScreeningParams) => {
  // make shure submissionValues are only integers
  Object.keys(params.values).forEach((key) => {
    const numericVal = parseInt(params.values[key].toString());
    if (!numericVal && numericVal !== 0)
      throw new Error(`Invalid value: ${params.values[key]}, must be integer`);
    params.values[key] = numericVal;
  });

  const values = {
    submitter_id: params.submitter_id,
    form_id: params.form_id,
    applicant_id: params.applicant_id,
    submission: JSON.stringify(params.values),
  };

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
  values: {[key: string]: string | number};
}) => {
  if (!params.values) {
    const condition =
      ' WHERE applicant_id=${applicant_id} AND submitter_id=${submitter_id}';
    const stmt = 'SELECT * FROM screening' + condition;
    return db.any(stmt, params);
  }

  const update = db.$config.pgp.helpers.update;
  const condition =
    ' WHERE submitter_id=${submitter_id} AND applicant_id=${applicant_id}';
  const returing = ' RETURNING *';
  const stmt =
    update({submission: JSON.stringify(params.values)}, null, 'screening') +
    condition +
    returing;

  return db.one(stmt, params);
};
