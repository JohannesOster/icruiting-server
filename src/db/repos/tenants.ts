import {IDatabase, IMain} from 'pg-promise';

export const TenantsRepository = (db: IDatabase<any>, pgp: IMain) => ({
  insert: (values: {tenantId?: string; tenantName: string}) => {
    const stmt = pgp.helpers.insert(values, null, 'tenant') + ' RETURNING *';
    return db.one(stmt);
  },
  delete: (tenantId: string) => {
    const stmt = 'DELETE FROM tenant WHERE tenantId=$1';
    return db.none(stmt, tenantId);
  },
});
