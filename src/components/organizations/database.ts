import db from 'db';

export const dbInsertOrganization = (params: {
  organization_name: string;
  organization_id?: string;
}) => {
  const {insert} = db.$config.pgp.helpers;
  const query = insert(params, null, 'organization') + ' RETURNING *';

  return db.one(query);
};
