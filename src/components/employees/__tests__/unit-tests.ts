import faker from 'faker';
import {removePrefixFromUserAttribute} from '../utils';

describe('employees', () => {
  describe('removePrefixFromUserAttribute', () => {
    it('Removes prefix', () => {
      const prefix = 'custom';
      const separator = ':';
      const attributeName = faker.random.word();

      const attribute = prefix + separator + attributeName;
      const result = removePrefixFromUserAttribute(attribute);

      expect(result).toBe(attributeName);
    });

    it('Does nothing without prefix', () => {
      const attributeName = faker.random.word();
      const result = removePrefixFromUserAttribute(attributeName);

      expect(result).toBe(attributeName);
    });
  });
});
