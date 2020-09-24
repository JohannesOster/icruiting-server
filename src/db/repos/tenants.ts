import {IDatabase, IMain} from 'pg-promise';

export const TenantsRepository = (db: IDatabase<any>, pgp: IMain) => ({
  insert: (values: {tenant_id?: string; tenant_name: string}) => {
    const stmt = pgp.helpers.insert(values, null, 'tenant') + ' RETURNING *';
    return db.one(stmt);
  },
  delete: (tenant_id: string) => {
    const stmt = 'DELETE FROM tenant WHERE tenant_id=$1';
    return db.none(stmt, tenant_id);
  },
});
