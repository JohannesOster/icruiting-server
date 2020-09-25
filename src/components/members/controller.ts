import {CognitoIdentityServiceProvider} from 'aws-sdk';
import {catchAsync} from 'errorHandling';
import {removePrefix} from './utils';

export const createMember = catchAsync(async (req, res) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {emails} = req.body;
  const {userPoolID, tenantId} = res.locals.user;

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

export const getMembers = catchAsync(async (req, res) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {userPoolID, tenantId, email} = res.locals.user;
  const params = {
    UserPoolId: userPoolID,
    Filter: 'cognito:user_status="CONFIRMED"',
    AttributesToGet: ['email', 'name', 'custom:user_role', 'custom:tenant_id'],
  };

  const {Users} = await cIdp.listUsers(params).promise();

  const userMaps = Users?.map((user) => {
    const prefix = 'custom:';
    const map = user.Attributes?.reduce((acc, curr) => {
      const attrName = removePrefix(curr.Name, prefix);
      acc[attrName] = curr.Value;
      return acc;
    }, {} as any);

    return map;
  });

  // filter out foreign orgs
  const filtered = userMaps?.filter((user) => user['tenant_id'] === tenantId);
  // filter out requesting user
  const withoutMe = filtered?.filter((user) => user.email !== email);

  res.status(200).json(withoutMe);
});

export const updateMember = catchAsync(async (req, res) => {
  const cIdp = new CognitoIdentityServiceProvider();
  const {userPoolID} = res.locals.user;
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
