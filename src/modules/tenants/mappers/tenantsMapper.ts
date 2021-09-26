import {Tenant as TenantEntity} from '../domain';
import {DBTenant} from '../infrastructure/repositories/tenantsRepository';

const toPersistance = (tenant: TenantEntity): DBTenant => {
  const {id: tenantId, ..._tenant} = tenant;
  return Object.freeze({tenantId, ..._tenant});
};

const toDTO = (tenant: TenantEntity) => {
  const {id: tenantId, ..._tenant} = tenant;
  return Object.freeze({tenantId, ..._tenant});
};

export const tenantsMapper = {toPersistance, toDTO};
