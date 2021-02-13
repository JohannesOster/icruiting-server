import {catchAsync} from 'adapters/errorHandling';
import {TenantService} from 'domain/services';

export const TenantsAdapter = () => {
  const tenants = TenantService();
  const create = catchAsync(async (req, res) => {
    const {tenantName, email, password, stripePriceId} = req.body;
    const response = await tenants.create(
      tenantName,
      email,
      password,
      stripePriceId,
    );

    res.status(201).json(response);
  });

  const retrieve = catchAsync(async (req, res) => {
    const {tenantId} = req.user;
    const response = await tenants.retrieve(tenantId);
    res.status(200).json(response);
  });

  const del = catchAsync(async (req, res) => {
    const {userPoolID, tenantId} = req.user;
    await tenants.del(tenantId, userPoolID);
    res.status(200).json();
  });

  return {create, retrieve, del};
};
