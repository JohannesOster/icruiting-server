import {createJobRequirement} from '.';

describe('createJobRequirement', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      const jobRequirement = createJobRequirement({
        requirementLabel: 'Kreativität',
      });

      const setLabel = () => {
        jobRequirement.requirementLabel = 'Alleinstellungsmerkmal';
      };

      expect(setLabel).toThrow();
    });
  });

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        requirementLabel: 'Empathie',
        unknownProp: 'unknownProp',
      } as any;

      const jobRequirement = createJobRequirement(params) as any;
      expect(jobRequirement.unknownProp).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('drops null or undefined properties', () => {
      const jobRequirement = createJobRequirement({
        requirementLabel: 'Teamfit',
        minValue: null as any,
      });

      expect(jobRequirement.minValue).toBeUndefined();
      expect(Object.keys(jobRequirement).length).toBe(2);
    });
  });
});
