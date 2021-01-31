import {CognitoIdentityServiceProvider} from 'aws-sdk';
import {mapCognitoUser, removePrefix} from 'components/utils';
import {catchAsync} from 'errorHandling';

export const create = catchAsync(async (req, res) => {
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
  res.status(201).json(resp);
});

export const retrieve = catchAsync(async (req, res) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {userPoolID, tenantId, email} = req.user;
  const params = {
    UserPoolId: userPoolID,
    Filter: 'cognito:user_status="CONFIRMED"',
    AttributesToGet: ['email', 'custom:user_role', 'custom:tenant_id'],
  };

  const {Users} = await cIdp.listUsers(params).promise();
  if (!Users) return res.status(200).json([]);

  const keyModifier = (key: string) => removePrefix(key, 'custom:');
  const userMaps = Users.map((user) => mapCognitoUser(user, keyModifier));

  // filter out foreign tenants
  const filtered = userMaps?.filter((user) => user.tenant_id === tenantId);

  // filter out requesting user
  const withoutMe = filtered?.filter((user) => user.email !== email);

  res.status(200).json(withoutMe);
});

export const update = catchAsync(async (req, res) => {
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

  res.status(200).json(resp);
});
