import {Calculator} from '../../../../src/components/applicants/report/calculator';

describe('Calculator', () => {
  describe('score', () => {
    it('calculates mean correctly', () => {
      const math = Calculator();
      const data = [0, 4];
      const [mean] = math.score(data);
      expect(mean).toEqual(2);
    });

    it('calculates stdDev correclty', () => {
      const math = Calculator();
      const data = [0, 4];
      const [, stdev] = math.score(data);
      expect(stdev).toEqual(2);
    });
  });

  describe('mean', () => {
    it('calculates mean correctly', () => {
      const math = Calculator();
      const data = [2, 4, 6, 8];
      const mean = math.mean(data);
      expect(mean).toEqual(5);
    });
  });
  describe('stdDev', () => {
    it('calculates stdDev correclty', () => {
      const math = Calculator();
      const data = [0, 2];
      const stdDev = math.stdDev(data);
      expect(stdDev).toEqual(1);
    });
  });

  describe('deepScore', () => {
    it('calculates mean and stdDev of nested values', () => {
      const submissions = {
        submitter1: {formId1: {formField1: '0'}},
        submitter2: {formId1: {formField1: '4'}},
      };
      const calculator = Calculator();
      const path = 'formId1.formField1';
      const [mean, stdDev] = calculator.deepScore(submissions, path);
      expect(mean).toEqual(2);
      expect(stdDev).toEqual(2);
    });
  });
});
