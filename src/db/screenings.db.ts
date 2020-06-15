import db from '.';
import {body, param} from 'express-validator';

type insertScreeningParams = {
  submitterId: string;
  form: any;
  body: {applicantId: string; [key: string]: any};
};
export const insertScreening = (params: insertScreeningParams) => {
  const {applicantId, ...submissionValues} = params.body;
  const values = {
    submitter_id: params.submitterId,
    form_id: params.form.form_id,
    applicant_id: applicantId,
    submission: JSON.stringify(submissionValues),
  };

  const stmt =
    db.$config.pgp.helpers.insert(values, null, 'screening') + ' RETURNING *';
  return db.any(stmt);
};
