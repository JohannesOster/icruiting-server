import {
  CognitoUserAttribute,
  CognitoUserPool,
  ISignUpResult,
} from 'amazon-cognito-identity-js';
import {BaseError} from 'application/errorHandling';
import {CognitoIdentityServiceProvider} from 'aws-sdk';
import CognitoExpress from 'cognito-express';
import {mapCognitoUser, removePrefix} from './utils';
import dotenv from 'dotenv';

export const AuthService = () => {
  dotenv.config();
  const cognitoUserPoolId = process.env.AWS_USER_POOL_ID;
  const clientId = process.env.AWS_CLIENT_ID;
  const region = process.env.AWS_REGION;

  if (!(cognitoUserPoolId && clientId && region)) {
    throw new Error('Missing required aws credentials!');
  }

  const cognitoExpress = new CognitoExpress({
    region,
    cognitoUserPoolId,
    tokenUse: 'id',
    tokenExpiration: 3600000,
  });

  const validateToken = (token: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      cognitoExpress.validate(token, (err: Error, payload: any) => {
        if (err) reject(new BaseError(401, err.message));
        resolve({
          tenantId: payload['custom:tenant_id'],
          userId: payload.sub,
          userRole: payload['custom:user_role'],
          email: payload.email,
        });
      });
    });
  };

  type createUserProps = {
    email: string;
    tenantId: string;
    userRole: 'member' | 'admin';
  };
  const createUser = (user: createUserProps) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const params = {
      UserPoolId: cognitoUserPoolId,
      Username: user.email,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        {Name: 'email', Value: user.email},
        {Name: 'custom:tenant_id', Value: user.tenantId},
        {Name: 'custom:user_role', Value: user.userRole},
      ],
    };

    return cIdp.adminCreateUser(params).promise();
  };
  type SignUpParams = {tenantId: string; email: string; password: string};
  const signUpUser = ({
    tenantId,
    email,
    password,
  }: SignUpParams): Promise<ISignUpResult> => {
    const config = {UserPoolId: cognitoUserPoolId, ClientId: clientId};
    const userPool = new CognitoUserPool(config);
    const attributes = [
      new CognitoUserAttribute({Name: 'custom:tenant_id', Value: tenantId}),
      new CognitoUserAttribute({Name: 'custom:user_role', Value: 'admin'}),
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributes, [], (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new BaseError(500, 'Failed to signup user'));
        resolve(result);
      });
    });
  };

  const listUsers = (tenantId: string): Promise<{[key: string]: string}[]> => {
    const cIdp = new CognitoIdentityServiceProvider();
    return new Promise(async (resolve) => {
      const params = {
        UserPoolId: cognitoUserPoolId,
        AttributesToGet: [
          'sub',
          'email',
          'custom:user_role',
          'custom:tenant_id',
          'cognito:user_status',
        ],
      };

      const {Users} = await cIdp.listUsers(params).promise();
      if (!Users) return resolve([]);

      const keyModifier = (key: string) => removePrefix(key, 'custom:');
      const userMaps = Users.map((user) => mapCognitoUser(user, keyModifier));

      // filter out foreign tenants
      const filtered = userMaps?.filter((user) => user.tenant_id === tenantId);

      resolve(filtered);
    });
  };

  type UpdateUserRoleParams = {userRole: string; email: string};
  const updateUserRole = ({userRole, email}: UpdateUserRoleParams) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const params = {
      UserPoolId: cognitoUserPoolId,
      Username: email,
      UserAttributes: [{Name: 'custom:user_role', Value: userRole}],
    };
    return cIdp.adminUpdateUserAttributes(params).promise();
  };

  const deleteUser = (email: string) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const params = {UserPoolId: cognitoUserPoolId, Username: email};
    return cIdp.adminDeleteUser(params).promise();
  };

  const retrieve = (email: string) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const params = {UserPoolId: cognitoUserPoolId, Username: email};
    return cIdp.adminGetUser(params).promise();
  };

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
