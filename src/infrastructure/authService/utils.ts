import {CognitoIdentityServiceProvider} from 'aws-sdk';

type KeyValuePair<T> = {
  [key: string]: T;
};

export const mapCognitoUser = (
  user: CognitoIdentityServiceProvider.UserType,
  keyModifier?: (key: string) => string,
) => {
  const attributes: KeyValuePair<string> = {};
  attributes.status = user.UserStatus || 'DISABLED';
  if (!user.Attributes?.length) return attributes;
  return {
    ...attributes,
    ...user.Attributes.reduce((acc, curr) => {
      if (!curr.Value) return acc;
      const key = keyModifier ? keyModifier(curr.Name) : curr.Name;
      acc[key] = curr.Value;
      return acc;
    }, {} as KeyValuePair<string>),
  };
};
export const removePrefix = (attribute: string, prefix: string) => {
  return attribute.split(prefix).slice(-1)[0];
};
