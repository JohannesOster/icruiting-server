import {RequestHandler} from 'express';
import {dbInsertOrganization, dbDeleteOrganization} from './database';
import {S3, CognitoIdentityServiceProvider} from 'aws-sdk';

export const createOrganization: RequestHandler = (req, res, next) => {
  const {organization_name} = req.body;
  dbInsertOrganization({organization_name})
    .then((resp) => {
      res.status(201).json(resp);
    })
    .catch(next);
};

export const deleteOrganization: RequestHandler = (req, res, next) => {
  const {orgID: organization_id} = res.locals.user;
  dbDeleteOrganization(organization_id)
    .then(async () => {
      const bucket = process.env.S3_BUCKET;
      if (!bucket) throw new Error('Missing Bucket credentials');

      const s3 = new S3();
      const listParams = {Bucket: bucket, Prefix: organization_id};
      try {
        const {Contents} = await s3.listObjects(listParams).promise();
        if (Contents?.length) {
          const delParams = {
            Bucket: process.env.S3_BUCKET || '',
            Delete: {Objects: Contents.map(({Key}) => ({Key: Key || ''}))},
          };
          await s3.deleteObjects(delParams).promise();
        }

        const cIdp = new CognitoIdentityServiceProvider();
        const {userPoolID, orgID} = res.locals.user;
        const params = {
          UserPoolId: userPoolID,
          AttributesToGet: ['email', 'custom:orgID'],
        };

        const users = await cIdp
          .listUsers(params)
          .promise()
          .then((resp) => {
            const userMaps = resp.Users?.map((user) => {
              const map = (user.Attributes || []).reduce((acc, curr) => {
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
      } catch (error) {
        next(error);
      }

      res.status(200).json();
    })
    .catch(next);
};
