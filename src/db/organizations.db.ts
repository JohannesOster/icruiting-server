import db from '.';

interface insertProductParams {
  organization_name: string;
}
export const insertProduct = (params: insertProductParams) => {
  const stmt =
    db.$config.pgp.helpers.insert(params, null, 'organization') +
    ' RETURNING organization_id';
  return db.one(stmt);
};

export const selectOrganization = (organization_id: string) => {
  const stmt = 'SELECT * FROM organization WHERE organization_id=$1';
  return db.one(stmt, organization_id);
};
