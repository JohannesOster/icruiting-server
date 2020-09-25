import {RequestHandler} from 'express';
import CognitoExpress from 'cognito-express';
import dotenv from 'dotenv';
import {BaseError, catchAsync} from 'errorHandling';

dotenv.config();

export const requireAuth: RequestHandler = catchAsync(
  async (req, res, next) => {
    const cognitoExpress = new CognitoExpress({
      region: process.env.AWS_REGION,
      cognitoUserPoolId: process.env.AWS_USER_POOL_ID,
      tokenUse: 'id',
      tokenExpiration: 3600000,
    });

    const authHeader = req.header('Authorization');
    if (!authHeader) throw new BaseError(401, 'Missing Authorization header');

    const token = authHeader.split(' ')[1];
    if (!token) throw new BaseError(401, 'Invalid Token');

    cognitoExpress.validate(token, (err: Error, payload: any) => {
      if (err) next(new BaseError(401, err.message));

      const lastSlashIdx = payload.iss.lastIndexOf('/');
      const userPoolID = payload.iss.substring(lastSlashIdx + 1);
      res.locals.user = {
        tenantId: payload['custom:tenant_id'],
        userPoolID: userPoolID,
        userId: payload.sub,
        userRole: payload['custom:user_role'],
        email: payload.email,
      };

      next();
    });
  },
);

export const requireAdmin: RequestHandler = catchAsync(
  async (req, res, next) => {
    const userRole = res.locals.user.userRole;
    if (userRole !== 'admin') throw new BaseError(403, 'Admin required');
    next();
  },
);
