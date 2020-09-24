import {IDatabase, IMain} from 'pg-promise';
import {decamelizeKeys} from 'humps';

export const TenantsRepository = (db: IDatabase<any>, pgp: IMain) => ({
  insert: (params: {tenantId?: string; tenantName: string}) => {
    const values = decamelizeKeys(params);
    const stmt = pgp.helpers.insert(values, null, 'tenant') + ' RETURNING *';
    return db.one(stmt);
  },
  delete: (tenantId: string) => {
    const stmt = 'DELETE FROM tenant WHERE tenant_id=$1';
    return db.none(stmt, tenantId);
  },
});
