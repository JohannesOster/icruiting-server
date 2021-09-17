import {createForm, createFormField} from '.';
import {ValidationError} from 'shared/domain';
import {random} from 'faker';

describe('createForm', () => {
  describe('immutability', () => {
    it('returns immutable form entity', () => {
      const form = createForm({
        tenantId: random.uuid(),
        jobId: random.uuid(),
        formCategory: 'application',
        formFields: [
          createFormField({
            component: 'input',
            label: 'Vollständiger Name',
            rowIndex: 0,
            required: true,
            visibility: 'all',
          }),
          createFormField({
            component: 'input',
            label: 'E-Mail-Adresse',
            rowIndex: 0,
            required: true,
            visibility: 'all',
          }),
        ],
      });

      const updateTitle = () => (form.formCategory = 'screening');
      expect(updateTitle).toThrowError(TypeError);
    });
  });

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        tenantId: random.uuid(),
        jobId: random.uuid(),
        formCategory: 'screening',
        formFields: [],
        unknownProp: 'unknownProp',
      } as any; // any to mimic runtime type error

      const form = createFormField(params) as any;
      expect(form.unknownProp).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('prohibits formTitle for application form', () => {
      const create = () => {
        createForm({
          tenantId: random.uuid(),
          jobId: random.uuid(),
          formCategory: 'application',
          formTitle: 'Application Form',
          formFields: [
            createFormField({
              component: 'input',
              label: 'E-Mail-Adresse',
              rowIndex: 0,
              required: true,
              visibility: 'all',
            }),
            createFormField({
              component: 'input',
              label: 'Vollständiger Name',
              rowIndex: 1,
              required: true,
              visibility: 'all',
            }),
          ],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('prohibits formTitle for screening form', () => {
      const create = () => {
        createForm({
          tenantId: random.uuid(),
          jobId: random.uuid(),
          formCategory: 'screening',
          formTitle: 'Screening Form',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('requires formTitle for assessment form', () => {
      const create = () => {
        createForm({
          tenantId: random.uuid(),
          jobId: random.uuid(),
          formCategory: 'assessment',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('requires formTitle for onboarding form', () => {
      const create = () => {
        createForm({
          tenantId: random.uuid(),
          jobId: random.uuid(),
          formCategory: 'onboarding',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('requires email and name field for application form', () => {
      const create = () => {
        createForm({
          tenantId: random.uuid(),
          jobId: random.uuid(),
          formCategory: 'application',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('drops null or undefined properties', () => {
      const form = createForm({
        tenantId: random.uuid(),
        jobId: random.uuid(),
        formCategory: 'screening',
        formFields: [],
        formTitle: null as any,
      });

      expect(form.formTitle).toBeUndefined();
      expect(Object.keys(form).length).toBe(5);
    });
  });
});
