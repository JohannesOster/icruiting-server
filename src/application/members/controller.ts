import {httpReqHandler} from 'application/errorHandling';
import authService from 'infrastructure/authService';
import db from 'infrastructure/db';

export const MembersAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {emails} = req.body;
    const {tenantId} = req.user;

    const promises = emails.map((email: string) => {
      return authService.createUser({userRole: 'member', tenantId, email});
    });

    const resp = await Promise.all(promises);
    return {status: 201, body: resp};
  });

  const list = httpReqHandler(async (req) => {
    const {tenantId, email} = req.user;
    const users = await authService.listUsers(tenantId);
    const withoutMe = users?.filter((user) => user.email !== email);
    return {body: withoutMe};
  });

  const update = httpReqHandler(async (req) => {
    const {user_role: userRole} = req.body;
    const {username: email} = req.params;

    const params = {userRole, email};
    const user = await authService.updateUserRole(params);

    return {body: user};
  });

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {username: email} = req.params;
    const {Username} = await authService.retrieve(email);
    await db.formSubmissions.bulkDel(tenantId, Username);
    await authService.deleteUser(email);
    return {};
  });

  return {create, list, update, del};
};
