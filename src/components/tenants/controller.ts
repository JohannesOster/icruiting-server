import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import {catchAsync} from 'errorHandling';
import db from 'db';

export const createTenant = catchAsync(async (req, res) => {
  const {tenant_name} = req.body;
  const resp = await db.tenants.insert({tenant_name});
  res.status(201).json(resp);
});

export const deleteTenant = catchAsync(async (req, res) => {
  const {userPoolID, tenant_id} = res.locals.user;

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET || '';
  const listParams = {Bucket: bucket, Prefix: tenant_id};

  const {Contents} = await s3.listObjects(listParams).promise();
  if (Contents?.length) {
    const keys = Contents.map(({Key}) => ({Key: Key || ''}));
    const delParams = {Bucket: bucket, Delete: {Objects: keys}};
    await s3.deleteObjects(delParams).promise();
  }

  const cIdp = new CognitoIdentityServiceProvider();
  const params = {
    UserPoolId: userPoolID,
    AttributesToGet: ['email', 'custom:tenant_id'],
  };

  const users = await cIdp
    .listUsers(params)
    .promise()
    .then((resp) => {
      const userMaps = resp.Users?.map((user) => {
        if (!user.Attributes?.length) return {};
        const map = user.Attributes.reduce((acc, curr) => {
          if (!curr.Value) return acc;
          acc[curr.Name] = curr.Value;
          return acc;
        }, {} as {[key: string]: string});

        return map;
      });

      // filter out foreign orgs
      return userMaps?.filter((user) => user['custom:tenant_id'] === tenant_id);
    });

  const promises = users?.map((user) => {
    const params = {UserPoolId: userPoolID, Username: user.email};
    return cIdp.adminDeleteUser(params).promise();
  });

  await Promise.all(promises || []);
  await db.tenants.delete(tenant_id);

  res.status(200).json();
});
