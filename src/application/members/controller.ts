import {CognitoIdentityServiceProvider} from 'aws-sdk';
import {mapCognitoUser, removePrefix} from '../utils';
import {httpReqHandler} from 'application/errorHandling';

export const MembersAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const {emails} = req.body;
    const {userPoolID, tenantId} = req.user;

    const promises = emails.map((email: string) => {
      const params = {
        UserPoolId: userPoolID,
        Username: email,
        DesiredDeliveryMediums: ['EMAIL'],
        UserAttributes: [
          {Name: 'email', Value: email},
          {Name: 'custom:tenant_id', Value: tenantId},
          {Name: 'custom:user_role', Value: 'member'},
        ],
      };

      return cIdp.adminCreateUser(params).promise();
    });

    const resp = await Promise.all(promises);
    return {status: 201, body: resp};
  });

  const retrieve = httpReqHandler(async (req) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const {userPoolID, tenantId, email} = req.user;
    const params = {
      UserPoolId: userPoolID,
      Filter: 'cognito:user_status="CONFIRMED"',
      AttributesToGet: ['email', 'custom:user_role', 'custom:tenant_id'],
    };

    const {Users} = await cIdp.listUsers(params).promise();
    if (!Users) return {body: []};

    const keyModifier = (key: string) => removePrefix(key, 'custom:');
    const userMaps = Users.map((user) => mapCognitoUser(user, keyModifier));

    // filter out foreign tenants
    const filtered = userMaps?.filter((user) => user.tenant_id === tenantId);

    // filter out requesting user
    const withoutMe = filtered?.filter((user) => user.email !== email);

    return {body: withoutMe};
  });

  const update = httpReqHandler(async (req) => {
    const cIdp = new CognitoIdentityServiceProvider();
    const {userPoolID} = req.user;
    const {user_role} = req.body;
    const {username} = req.params;

    const params = {
      UserPoolId: userPoolID,
      Username: username,
      UserAttributes: [{Name: 'custom:user_role', Value: user_role}],
    };
    const resp = await cIdp.adminUpdateUserAttributes(params).promise();

    return {body: resp};
  });

  return {create, retrieve, update};
};
