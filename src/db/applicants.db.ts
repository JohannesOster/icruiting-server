import db from '.';

export const insertApplicant = async (params: any) => {
  const stmt =
    db.$config.pgp.helpers.insert(params, null, 'applicant') + ' RETURNING *';
  return db.any(stmt);
};
