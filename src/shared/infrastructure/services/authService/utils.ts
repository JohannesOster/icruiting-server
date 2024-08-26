import {UserType} from '@aws-sdk/client-cognito-identity-provider';

type KeyValuePair<T> = {
  [key: string]: T;
};

export const mapCognitoUser = (user: UserType, keyModifier?: (key: string) => string) => {
  const attributes: KeyValuePair<string> = {};
  if (user.UserStatus) attributes.status = user.UserStatus;
  if (!user.Attributes?.length) return attributes;
  return {
    ...attributes,
    ...user.Attributes.reduce((acc, curr) => {
      if (!(curr.Value && curr.Name)) return acc;
      const key = keyModifier ? keyModifier(curr.Name) : curr.Name;
      acc[key] = curr.Value;
      return acc;
    }, {} as KeyValuePair<string>),
  };
};
export const removePrefix = (attribute: string, prefix: string) => {
  return attribute.split(prefix).slice(-1)[0];
};
