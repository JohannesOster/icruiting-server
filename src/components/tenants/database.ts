import db from 'db';
import {tenant} from './types';

export const dbInsertTenant = (params: tenant) => {
  const {insert} = db.$config.pgp.helpers;
  const query = insert(params, null, 'tenant') + ' RETURNING *';

  return db.one(query);
};

export const dbDeleteTenant = (tenant_id: string) => {
  const query = 'DELETE FROM tenant WHERE tenant_id=$1';
  return db.none(query, tenant_id);
};
