export const AuthService = () => {
  const validateToken = () => Promise.resolve({});
  const createUser = ({email, tenantId, userRole}: any) => {
    const Attributes = [
      {Name: 'email', Value: email},
      {Name: 'custom:tenant_id', Value: tenantId},
      {Name: 'custom:user_role', Value: userRole},
    ];

    return Promise.resolve({User: {Username: email, Attributes}});
  };
  const signUpUser = () => Promise.resolve({user: {}});
  const listUsers = () => Promise.resolve([]);
  const updateUserRole = ({userRole}: any) => {
    return Promise.resolve({
      Attributes: [{Name: 'custom:user_role', Value: userRole}],
    });
  };
  const deleteUser = () => Promise.resolve();
  const retrieve = () => Promise.resolve({});

  return {
    validateToken,
    createUser,
    signUpUser,
    listUsers,
    retrieve,
    deleteUser,
    updateUserRole,
  };
};
