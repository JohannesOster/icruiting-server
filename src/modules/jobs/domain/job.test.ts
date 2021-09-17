import {createJob} from '.';

describe('createJob', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      const job = createJob({
        jobTitle: 'IBM - Head of Prodcut',
        jobRequirements: [],
      });

      const setJobTitle = () => {
        job.jobTitle = 'IBM - Head of Marketing';
      };

      expect(setJobTitle).toThrow();
    });
  });

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        jobTitle: 'IBM - Head of Prodcut',
        jobRequirements: [],
        unknownProp: 'unknownProp',
      } as any;

      const job = createJob(params) as any;
      expect(job.unknownProp).toBeUndefined();
    });
  });
});
