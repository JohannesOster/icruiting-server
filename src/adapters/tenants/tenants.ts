import {httpReqHandler} from 'adapters/errorHandling';
import {TenantService} from 'domain/services';

export const TenantsAdapter = () => {
  const tenants = TenantService();
  const create = httpReqHandler(async (req) => {
    const {tenantName, email, password, stripePriceId} = req.body;
    const response = await tenants.create(
      tenantName,
      email,
      password,
      stripePriceId,
    );

    return {status: 201, body: response};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const response = await tenants.retrieve(tenantId);
    return {body: response};
  });

  const del = httpReqHandler(async (req) => {
    const {userPoolID, tenantId} = req.user;
    await tenants.del(tenantId, userPoolID);
    return {};
  });

  return {create, retrieve, del};
};
