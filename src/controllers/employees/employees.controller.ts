import {RequestHandler} from 'express';
import {CognitoIdentityServiceProvider} from 'aws-sdk';
import {validationResult} from 'express-validator';

export const createEmployee: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

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
      {Name: 'custom:role', Value: 'admin'},
    ],
  };

  cIdp
    .adminCreateUser(params)
    .promise()
    .then((resp) => {
      res.status(200).json(resp);
    })
    .catch((err) => {
      next(err);
    });
};

export const getEmployees: RequestHandler = (req, res, next) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const params = {
    UserPoolId: res.locals.user.userPoolID,
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
        const map = user['Attributes']?.reduce((acc: any, curr) => {
          const attrName = curr['Name'].split(':').slice(-1)[0];
          acc[attrName] = curr['Value'];
          return acc;
        }, {});

        return map;
      });

      res
        .status(200)
        .json(
          userMaps?.filter((user) => user['orgID'] === res.locals.user.orgID),
        );
    })
    .catch((err) => {
      next(err);
    });
};
