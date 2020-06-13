import db from '.';

interface insertOrganizationParams {
  organization_name: string;
}
export const insertOrganization = (params: insertOrganizationParams) => {
  const stmt =
    db.$config.pgp.helpers.insert(params, null, 'organization') +
    ' RETURNING *';
  return db.one(stmt);
};
