import {v4 as uuidv4} from 'uuid';

type BaseTenant = {
  tenantName: string;
  stripeCustomerId?: string;
  theme?: string;
};

export type Tenant = {
  tenantId: string;
} & BaseTenant;

export const createTenant = (tenant: BaseTenant): Tenant => {
  return Object.freeze({tenantId: uuidv4(), ...tenant});
};
