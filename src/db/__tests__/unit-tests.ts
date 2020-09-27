import {round} from '../utils';

describe('database repositories', () => {
  describe('round', () => {
    it('rounds default to 2 digits', () => {
      const numb = 1.234;
      const result = round(numb);
      expect(result).toBe(1.23);
    });
    it('rounds default to provided digits', () => {
      const numb = 1.2345678;
      const result = round(numb, 3);
      expect(result).toBe(1.235);
    });
  });
});
