import {random} from 'faker';
import {createApplicant} from '.';

describe('createApplicant', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      const applicant = createApplicant({
        applicantStatus: 'applied',
        jobId: random.uuid(),
        attributes: [],
        files: [],
      });
      const setApplicantStatus = () => {
        applicant.applicantStatus = 'confirmed';
      };

      expect(setApplicantStatus).toThrow();
    });
  });

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        applicantStatus: 'applied',
        jobId: random.uuid(),
        attributes: [],
        files: [],
        unknownProp: 'unknownProp',
      } as any; // any to mimic runtime type error

      const applicant = createApplicant(params) as any;
      expect(applicant.unknownProp).toBeUndefined();
    });
  });
});
