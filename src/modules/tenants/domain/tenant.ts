import {
  createEntity,
  Entity,
  EntityFactory,
  ValidationError,
} from 'shared/domain';

interface BaseTenant {
  /** A short name of the overall group of users, the organization, etc. */
  tenantName: string;
  /** A stripe customer id */
  stripeCustomerId?: string;
  /** A url to a theme file */
  theme?: string;
}

export interface Tenant extends BaseTenant, Entity {}

export const createTenant: EntityFactory<BaseTenant, Tenant> = (props, id) => {
  const {tenantName, stripeCustomerId, theme} = props;

  if (!tenantName.length)
    throw new ValidationError('Property tenantName cannot be empty string');

  const tenant: BaseTenant = {tenantName, stripeCustomerId, theme};
  return createEntity(tenant, id);
};
