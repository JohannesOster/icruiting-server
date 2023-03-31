import {BaseError} from 'application';
import authService from 'infrastructure/authService';
import {catchAsync} from '../httpReqHandler';

export const requireAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) throw new BaseError(401, 'Missing Authorization header');

  const token = authHeader.split(' ')[1];
  if (!token) throw new BaseError(401, 'Invalid Token');

  await authService
    .validateToken(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(next);
});

export const requireAdmin = catchAsync((req, res, next) => {
  const userRole = req.user.userRole;
  if (userRole !== 'admin') throw new BaseError(403, 'Admin required');
  next();
});
