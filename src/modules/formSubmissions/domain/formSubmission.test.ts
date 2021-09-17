import {createFormSubmission} from '.';
import {random} from 'faker';

describe('createFormSubmission', () => {
  describe('immutability', () => {
    it('returns immutable form entity', () => {
      const formSubmission = createFormSubmission({
        formId: random.uuid(),
        submitterId: random.uuid(),
        applicantId: random.uuid(),
        submission: {[random.uuid()]: '0'},
      });

      const updateSubmitterId = () => (formSubmission.submitterId = '');
      expect(updateSubmitterId).toThrowError(TypeError);
    });
  });

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        formId: random.uuid(),
        submitterId: random.uuid(),
        applicantId: random.uuid(),
        submission: {[random.uuid()]: '0'},
        unknownProp: 'unknownProp',
      } as any; // any to mimic runtime type error

      const formSubmission = createFormSubmission(params) as any;
      expect(formSubmission.unknownProp).toBeUndefined();
    });
  });
});
