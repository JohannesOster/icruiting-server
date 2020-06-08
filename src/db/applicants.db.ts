import db from '.';

export const insertApplicant = (params: any) => {
  const stmt =
    db.$config.pgp.helpers.insert(params, null, 'applicant') + ' RETURNING *';
  return db.any(stmt);
};

export const selectApplicants = (organization_id: string) => {
  const stmt = 'SELECT * FROM applicant WHERE organization_id=$1';
  return db.any(stmt, organization_id);
};
