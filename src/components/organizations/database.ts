import db from 'db';
import {organization} from './types';

export const dbInsertOrganization = (params: organization) => {
  const {insert} = db.$config.pgp.helpers;
  const query = insert(params, null, 'organization') + ' RETURNING *';

  return db.one(query);
};

export const dbDeleteOrganization = (organization_id: string) => {
  const query = 'DELETE FROM organization WHERE organization_id=$1';
  return db.none(query, organization_id);
};
