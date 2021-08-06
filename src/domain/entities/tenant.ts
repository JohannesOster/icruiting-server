import {v4 as uuid} from 'uuid';

type BaseTenant = {
  /** A short name of the overall group of users, the organization, etc. */
  tenantName: string;
  /** A stripe customer id */
  stripeCustomerId?: string;
  /** A url to a theme file */
  theme?: string;
};

export type Tenant = {
  /** A unique id */
  tenantId: string;
} & BaseTenant;

export const createTenant = (
  tenant: BaseTenant & {tenantId?: string},
): Tenant => {
  const tenantId = tenant.tenantId || uuid();

  if (!tenant.tenantName.length)
    throw new Error('Property tenantName cannot be empty string');

  return Object.freeze({...tenant, tenantId});
};
