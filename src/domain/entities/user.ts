import {v4 as uuidv4} from 'uuid';

type UserRole = 'admin' | 'member';

type BaseUser = {
  tenantId: string;
  email: string;
  userRole: UserRole;
};

export type User = {
  userId: string;
} & BaseUser;

export const createUser = (user: BaseUser): User => {
  return Object.freeze({
    userId: uuidv4(),
    ...user,
  });
};
