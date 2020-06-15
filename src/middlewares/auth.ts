import {RequestHandler} from 'express';
import CognitoExpress from 'cognito-express';
import dotenv from 'dotenv';
dotenv.config();

const cognitoExpress = new CognitoExpress({
  region: process.env.AWS_REGION,
  cognitoUserPoolId: process.env.AWS_USER_POOL_ID,
  tokenUse: 'id',
  tokenExpiration: 3600000,
});

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token)
    return res.status(401).json({message: 'Baerer Token missing from header'});

  if (token.split(' ').length !== 2 || !token.split(' ')[1])
    return res.status(401).json({message: 'Invalid Token.'});

  cognitoExpress.validate(token.split(' ')[1], (err: any, payload: any) => {
    if (err) return res.status(401).json({message: err});

    const lastSlashIdx = payload.iss.lastIndexOf('/');
    const userPoolID = payload.iss.substring(lastSlashIdx + 1);

    res.locals.user = {
      orgID: payload['custom:orgID'],
      userPoolID: userPoolID,
      sub: payload.sub,
    };
    next();
  });
};
