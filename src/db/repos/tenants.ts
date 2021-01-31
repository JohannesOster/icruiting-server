import {IDatabase, IMain} from 'pg-promise';
import {decamelizeKeys} from 'humps';

type Tenant = {
  tenantId: string;
  tenantName: string;
  stripeCustomerId?: string;
  theme?: string;
  createdAt: string;
};

export const TenantsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const create = (params: {
    tenantId?: string;
    tenantName: string;
    stripeCustomerId?: string;
  }): Promise<Tenant> => {
    const values = decamelizeKeys(params);
    const stmt = pgp.helpers.insert(values, null, 'tenant') + ' RETURNING *';
    return db.one(stmt);
  };

  const del = (tenantId: string): Promise<null> => {
    const stmt = 'DELETE FROM tenant WHERE tenant_id=$1';
    return db.none(stmt, tenantId);
  };

  const retrieve = (tenantId: string): Promise<Tenant | null> => {
    return db.oneOrNone('SELECT * FROM tenant WHERE tenant_id=$1', tenantId);
  };

  const updateTheme = async (tenantId: string, theme: string | null = null) => {
    return db.one(
      'UPDATE tenant SET theme=${theme} WHERE tenant_id=${tenant_id} RETURNING *',
      decamelizeKeys({tenantId, theme}),
    );
  };

  return {create, del, retrieve, updateTheme};
};
