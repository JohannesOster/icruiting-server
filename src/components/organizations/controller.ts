import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';
import {catchAsync} from 'errorHandling';
import {dbInsertOrganization, dbDeleteOrganization} from './database';

export const createOrganization = catchAsync(async (req, res) => {
  const {organization_name} = req.body;
  const resp = await dbInsertOrganization({organization_name});
  res.status(201).json(resp);
});

export const deleteOrganization = catchAsync(async (req, res) => {
  const {userPoolID, orgID} = res.locals.user;
  await dbDeleteOrganization(orgID);

  const s3 = new S3();
  const bucket = process.env.S3_BUCKET || '';
  const listParams = {Bucket: bucket, Prefix: orgID};

  const {Contents} = await s3.listObjects(listParams).promise();
  if (Contents?.length) {
    const keys = Contents.map(({Key}) => ({Key: Key || ''}));
    const delParams = {Bucket: bucket, Delete: {Objects: keys}};
    await s3.deleteObjects(delParams).promise();
  }

  const cIdp = new CognitoIdentityServiceProvider();
  const params = {
    UserPoolId: userPoolID,
    AttributesToGet: ['email', 'custom:orgID'],
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
      return userMaps?.filter((user) => user['custom:orgID'] === orgID);
    });

  const promises = users?.map((user) => {
    const params = {UserPoolId: userPoolID, Username: user.email};
    return cIdp.adminDeleteUser(params).promise();
  });

  await Promise.all(promises || []);

  res.status(200).json();
});
