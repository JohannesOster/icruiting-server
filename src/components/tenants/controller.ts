import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import {catchAsync} from 'errorHandling';
import db from 'db';
import { mapCognitoUser } from 'components/utils';

export const createTenant = catchAsync(async (req, res) => {
  const {tenantName} = req.body;
  const resp = await db.tenants.insert({tenantName});
  res.status(201).json(resp);
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
      if(!Users) return [];
      const users = Users.map(user => mapCognitoUser(user));
      
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
  if(!Contents?.length) return;
  
  const keys = Contents.map(({Key}) => ({Key: Key || ''}));
  const delParams = {Bucket: bucket, Delete: {Objects: keys}};
  await s3.deleteObjects(delParams).promise();
}
