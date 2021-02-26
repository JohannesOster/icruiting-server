import * as calc from '../../../../src/application/applicants/calcReport/calculator';

describe('Calculator', () => {
  describe('score', () => {
    it('calculates mean correctly', () => {
      const data = [0, 4];
      const [mean] = calc.score(data);
      expect(mean).toEqual(2);
    });

    it('calculates stdDev correclty', () => {
      const data = [0, 4];
      const [, stdev] = calc.score(data);
      expect(stdev).toEqual(2);
    });
  });

  describe('mean', () => {
    it('calculates mean correctly', () => {
      const data = [2, 4, 6, 8];
      const mean = calc.mean(data);
      expect(mean).toEqual(5);
    });
  });
  describe('stdDev', () => {
    it('calculates stdDev correclty', () => {
      const data = [0, 2];
      const stdDev = calc.stdDev(data);
      expect(stdDev).toEqual(1);
    });
  });

  describe('deepScore', () => {
    it('calculates mean and stdDev of nested values', () => {
      const submissions = {
        submitter1: {formId1: {formField1: '0'}},
        submitter2: {formId1: {formField1: '4'}},
      };
      const path = 'formId1.formField1';
      const [mean, stdDev] = calc.deepScore(submissions, path);
      expect(mean).toEqual(2);
      expect(stdDev).toEqual(2);
    });
  });

  describe('round', () => {
    it('rounds param correclty', () => {
      const numb = 1.256;
      expect(calc.round(numb)).toBe(1.26);
    });

    it('rounds param correclty to provided digits', () => {
      const numb = 1.25;
      expect(calc.round(numb, 1)).toBe(1.3);
    });

    it('defaults to 0 digits if digits param is negative', () => {
      const numb = 100.1;
      expect(calc.round(numb, -1)).toBe(100);
    });
  });
});
