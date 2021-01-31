type User = {
  userPoolID: string;
  userId: string;
  tenantId: string;
  email: string;
  userRole: 'admin' | 'member';
  stripeCustomerId?: string;
};

declare namespace Express {
  export interface Request {
    user: User;
  }
}
