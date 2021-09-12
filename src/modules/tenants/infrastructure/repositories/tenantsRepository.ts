import {decamelizeKeys} from 'humps';
import {DBAccess} from 'infrastructure/db';
import {Tenant, createTenant} from 'modules/tenants/domain';

export interface DBTenant {
  tenantId: string;
  tenantName: string;
  stripeCustomerId?: string;
  theme?: string;
}

export const TenantsRepository = ({db, pgp}: DBAccess) => {
  const create = (params: DBTenant): Promise<Tenant> => {
    const values = decamelizeKeys(params);
    const stmt = pgp.helpers.insert(values, null, 'tenant') + ' RETURNING *';
    return db.one(stmt).then((result) => createTenant(result, result.tenantId));
  };

  const del = (tenantId: string): Promise<null> => {
    const stmt = 'DELETE FROM tenant WHERE tenant_id=$1';
    return db.none(stmt, tenantId);
  };

  const retrieve = (tenantId: string): Promise<Tenant | null> => {
    return db
      .oneOrNone('SELECT * FROM tenant WHERE tenant_id=$1', tenantId)
      .then((result) => {
        if (!result) return null;
        return createTenant(result, result.tenantId);
      });
  };

  const updateTheme = (tenantId: string, theme: string | null = null) => {
    return db
      .one(
        'UPDATE tenant SET theme=${theme} WHERE tenant_id=${tenant_id} RETURNING *',
        decamelizeKeys({tenantId, theme}),
      )
      .then((result) => createTenant(result, result.tenantId));
  };

  return {create, del, retrieve, updateTheme};
};
