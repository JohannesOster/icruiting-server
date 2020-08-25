import {RequestHandler} from 'express';
import {CognitoIdentityServiceProvider} from 'aws-sdk';
import {removePrefixFromUserAttribute} from './utils';

export const createEmployee: RequestHandler = (req, res, next) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {email} = req.body;

  const params = {
    UserPoolId: res.locals.user.userPoolID,
    Username: email,
    DesiredDeliveryMediums: ['EMAIL'],
    //MessageAction: 'SUPPRESS',
    UserAttributes: [
      {Name: 'email', Value: email},
      {Name: 'custom:orgID', Value: res.locals.user.orgID},
      {Name: 'custom:role', Value: 'employee'},
    ],
  };

  cIdp
    .adminCreateUser(params)
    .promise()
    .then((resp) => res.status(201).json(resp))
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
  const {userPoolID, orgID} = res.locals.user;
  const {user_role} = req.body;
  const {username} = req.params;

  const params = {
    UserPoolId: res.locals.user.userPoolID,
    Username: username,
    UserAttributes: [{Name: 'custom:role', Value: user_role}],
  };

  cIdp
    .adminUpdateUserAttributes(params)
    .promise()
    .then((resp) => res.status(200).json(resp))
    .catch(next);
};
