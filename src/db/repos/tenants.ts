import {IDatabase, IMain} from 'pg-promise';
import {decamelizeKeys} from 'humps';

type Tenant = {
  tenantId: string;
  tenantName: string;
  stripeCustomerId?: string;
  createdAt: string;
};

export const TenantsRepository = (db: IDatabase<any>, pgp: IMain) => ({
  insert: (params: {
    tenantId?: string;
    tenantName: string;
    stripeCustomerId?: string;
  }): Promise<Tenant> => {
    const values = decamelizeKeys(params);
    const stmt = pgp.helpers.insert(values, null, 'tenant') + ' RETURNING *';
    return db.one(stmt);
  },
  delete: (tenantId: string): Promise<null> => {
    const stmt = 'DELETE FROM tenant WHERE tenant_id=$1';
    return db.none(stmt, tenantId);
  },
  find: (tenantId: string): Promise<Tenant | null> => {
    return db.oneOrNone('SELECT * FROM tenant WHERE tenant_id=$1', tenantId);
  },
});
