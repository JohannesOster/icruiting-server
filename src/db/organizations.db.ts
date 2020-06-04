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

export const selectOrganization = (organization_id: string) => {
  const stmt = 'SELECT * FROM organization WHERE organization_id=$1';
  return db.one(stmt, organization_id);
};
