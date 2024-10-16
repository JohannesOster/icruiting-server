import faker from 'faker';
import {UserType} from '@aws-sdk/client-cognito-identity-provider';
import {mapCognitoUser, removePrefix} from 'shared/infrastructure/services/authService/utils';

describe('utils', () => {
  describe('removePrefix', () => {
    it('removes prefix', () => {
      const prefix = 'custom:';
      const attributeName = faker.random.word();

      const attribute = prefix + attributeName;
      const result = removePrefix(attribute, prefix);

      expect(result).toBe(attributeName);
    });

    it('does nothing if parameter does not have prefix', () => {
      const attributeName = faker.random.word();
      const result = removePrefix(attributeName, 'custom:');

      expect(result).toBe(attributeName);
    });
  });

  describe('mapCognitoUser', () => {
    it('maps cognito user to keyvalue pairs of attributes', () => {
      const mockUser: UserType = {
        Attributes: [{Name: 'Attributename', Value: 'Attributevalue'}],
      };
      const user = mapCognitoUser(mockUser);
      expect(user.Attributename).toBe('Attributevalue');
    });

    it('ignores undefined values', () => {
      const mockUser: UserType = {
        Attributes: [{Name: 'Attributename', Value: undefined}],
      };
      const user = mapCognitoUser(mockUser);
      expect(Object.keys(user).length).toBe(0);
    });

    it('returns empty object if Attributes is empty', () => {
      const mockUser: UserType = {
        Attributes: [],
      };
      const user = mapCognitoUser(mockUser);
      expect(Object.keys(user).length).toBe(0);
    });

    it('returns empty object if Attributes is undefined', () => {
      const mockUser: UserType = {};
      const user = mapCognitoUser(mockUser);
      expect(Object.keys(user).length).toBe(0);
    });
  });
});
