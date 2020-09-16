import db from 'db';
import {tenant} from './types';

export const dbInsertTenant = (params: tenant) => {
  const {insert} = db.$config.pgp.helpers;
  const stmt = insert(params, null, 'tenant') + ' RETURNING *';

  return db.one(stmt);
};

export const dbDeleteTenant = (tenant_id: string) => {
  const stmt = 'DELETE FROM tenant WHERE tenant_id=$1';
  return db.none(stmt, tenant_id);
};
