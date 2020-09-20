import faker from 'faker';
import {removePrefix} from '../utils';

describe('employees', () => {
  describe('removePrefix', () => {
    it('Removes prefix', () => {
      const prefix = 'custom:';
      const attributeName = faker.random.word();

      const attribute = prefix + attributeName;
      const result = removePrefix(attribute, prefix);

      expect(result).toBe(attributeName);
    });

    it('Does nothing if word does not have prefix', () => {
      const attributeName = faker.random.word();
      const result = removePrefix(attributeName, 'custom:');

      expect(result).toBe(attributeName);
    });
  });
});
