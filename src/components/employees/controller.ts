import {RequestHandler} from 'express';
import {CognitoIdentityServiceProvider} from 'aws-sdk';
import {removePrefixFromUserAttribute} from './utils';

export const createEmployee: RequestHandler = (req, res, next) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {emails} = req.body;
  const {userPoolID, orgID} = res.locals.user;

  const promises = emails.map((email: string) => {
    const params = {
      UserPoolId: userPoolID,
      Username: email,
      DesiredDeliveryMediums: ['EMAIL'],
      //MessageAction: 'SUPPRESS',
      UserAttributes: [
        {Name: 'email', Value: email},
        {Name: 'custom:orgID', Value: orgID},
        {Name: 'custom:role', Value: 'employee'},
      ],
    };

    return cIdp.adminCreateUser(params).promise();
  });

  Promise.all(promises)
    .then((result) => res.status(201).json(result))
    .catch(next);
};

export const getEmployees: RequestHandler = (req, res, next) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {userPoolID, orgID} = res.locals.user;
  const params = {
    UserPoolId: userPoolID,
    Filter: 'cognito:user_status="CONFIRMED"',
    AttributesToGet: [
      'email',
      'custom:fullName',
      'custom:role',
      'custom:orgID',
    ],
  };

  cIdp
    .listUsers(params)
    .promise()
    .then((resp) => {
      const userMaps = resp['Users']?.map((user) => {
        // remove "custom:" prefix of Attributes (if it exists)
        const map = user['Attributes']?.reduce((acc, curr) => {
          const attrName = removePrefixFromUserAttribute(curr['Name']);
          acc[attrName] = curr['Value'];
          return acc;
        }, {} as any);

        return map;
      });

      // filter out foreign orgs
      const filtered = userMaps?.filter((user) => user['orgID'] === orgID);

      res.status(200).json(filtered);
    })
    .catch(next);
};

export const updateEmployee: RequestHandler = (req, res, next) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {userPoolID} = res.locals.user;
  const {user_role} = req.body;
  const {username} = req.params;

  const params = {
    UserPoolId: userPoolID,
    Username: username,
    UserAttributes: [{Name: 'custom:role', Value: user_role}],
  };

  cIdp
    .adminUpdateUserAttributes(params)
    .promise()
    .then((resp) => res.status(200).json(resp))
    .catch(next);
};
