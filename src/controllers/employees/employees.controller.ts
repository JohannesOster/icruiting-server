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
