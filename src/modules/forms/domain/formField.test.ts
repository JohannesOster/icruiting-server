import {createFormField} from '.';

describe('createTenant', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      const formField = createFormField({
        component: 'input',
        label: 'Vollständiger Name',
        rowIndex: 1,
        required: true,
        visibility: 'all',
      });

      const setComponent = () => {
        formField.component = 'checkbox';
      };

      expect(setComponent).toThrow();
    });
  });

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        component: 'input',
        label: 'Vollständiger Name',
        rowIndex: 1,
        required: true,
        visibility: 'all',
        unknownProp: 'unknownProp',
      } as any;

      const formField = createFormField(params) as any;
      expect(formField.unknownProp).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('drops null or undefined properties', () => {
      const formField = createFormField({
        component: 'input',
        label: 'Vollständiger Name',
        rowIndex: 1,
        required: true,
        visibility: 'all',

        intent: undefined,
        jobRequirementId: null as any,
      });

      expect(formField.jobRequirementId).toBeUndefined();
      expect(Object.keys(formField).length).toBe(6); // 5 + id
    });
  });
});
