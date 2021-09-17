export const AuthService = () => {
  const validateToken = () => Promise.resolve({});
  const createUser = () => Promise.resolve({});
  const signUpUser = () => Promise.resolve({user: {}});
  const listUsers = () => Promise.resolve([]);
  const updateUserRole = () => Promise.resolve({});
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
