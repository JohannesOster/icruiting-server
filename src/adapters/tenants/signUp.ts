import {
  CognitoUserPool,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

interface SignUpParams {
  tenantId: string;
  email: string;
  password: string;
}
export const signUp = async ({
  tenantId,
  email,
  password,
}: SignUpParams): Promise<any> => {
  const config = {
    UserPoolId: process.env.AWS_USER_POOL_ID || '',
    ClientId: process.env.AWS_CLIENT_ID || '',
  };
  const userPool = new CognitoUserPool(config);
  const attributes = [
    new CognitoUserAttribute({Name: 'custom:tenant_id', Value: tenantId}),
    new CognitoUserAttribute({Name: 'custom:user_role', Value: 'admin'}),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributes, [], (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};
