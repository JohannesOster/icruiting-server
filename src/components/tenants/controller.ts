import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import {catchAsync} from 'errorHandling';
import db from 'db';
import {mapCognitoUser} from 'components/utils';
import {
  CognitoUserPool,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const signUp = async (
  tenantId: string,
  name: string,
  email: string,
  password: string,
): Promise<any> => {
  const config = {
    UserPoolId: process.env.AWS_USER_POOL_ID || '',
    ClientId: process.env.AWS_CLIENT_ID || '',
  };
  const userPool = new CognitoUserPool(config);
  return new Promise((resolve, reject) => {
    userPool.signUp(
      email,
      password,
      [
        new CognitoUserAttribute({Name: 'name', Value: name}),
        new CognitoUserAttribute({Name: 'custom:tenant_id', Value: tenantId}),
        new CognitoUserAttribute({Name: 'custom:user_role', Value: 'admin'}),
      ],
      [],
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
  });
};

export const createTenant = catchAsync(async (req, res) => {
  const {tenantName, name, email, password} = req.body;
  const tenant = await db.tenants.insert({tenantName});
  const {User} = await signUp(tenant.tenantId, name, email, password);
  res.status(201).json({user: User, tenant});
});

export const deleteTenant = catchAsync(async (req, res) => {
  const {userPoolID, tenantId} = res.locals.user;

  deleteTenantFiles(tenantId);

  const cIdp = new CognitoIdentityServiceProvider();
  const params = {
    UserPoolId: userPoolID,
    AttributesToGet: ['email', 'custom:tenant_id'],
  };

  const users = await cIdp
    .listUsers(params)
    .promise()
    .then(({Users}) => {
      if (!Users) return [];
      const users = Users.map((user) => mapCognitoUser(user));

      // filter out foreign tenants
      return users.filter((user) => user['custom:tenant_id'] === tenantId);
    });

  const promises = users.map((user) => {
    const params = {UserPoolId: userPoolID, Username: user.email};
    return cIdp.adminDeleteUser(params).promise();
  });

  await Promise.all(promises || []);
  await db.tenants.delete(tenantId);

  res.status(200).json();
});

const deleteTenantFiles = async (tenantId: string) => {
  const s3 = new S3();
  const bucket = process.env.S3_BUCKET!;
  const listParams = {Bucket: bucket, Prefix: tenantId};

  const {Contents} = await s3.listObjects(listParams).promise();
  if (!Contents?.length) return;

  const keys = Contents.map(({Key}) => ({Key: Key || ''}));
  const delParams = {Bucket: bucket, Delete: {Objects: keys}};
  await s3.deleteObjects(delParams).promise();
};
