import {RequestHandler} from 'express';
import dotenv from 'dotenv';
import {BaseError, catchAsync} from 'application/errorHandling';
import authService from 'infrastructure/authService';

dotenv.config();

export const requireAuth: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) throw new BaseError(401, 'Missing Authorization header');

    const token = authHeader.split(' ')[1];
    if (!token) throw new BaseError(401, 'Invalid Token');

    authService
      .validateToken(token)
      .then((user) => {
        req.user = user;
      })
      .catch(next);
  },
);

export const requireAdmin: RequestHandler = catchAsync(
  async (req, res, next) => {
    const userRole = req.user.userRole;
    if (userRole !== 'admin') throw new BaseError(403, 'Admin required');
    next();
  },
);
