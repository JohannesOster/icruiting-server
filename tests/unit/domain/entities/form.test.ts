import {createForm} from 'domain/entities';
import {ValidationError} from 'domain/entities/error';
import {v4 as uuid} from 'uuid';

describe('createForm', () => {
  describe('immutability', () => {
    it('returns immutable form entity', () => {
      const form = createForm({
        tenantId: uuid(),
        jobId: uuid(),
        formCategory: 'application',
        formFields: [
          {
            component: 'input',
            label: 'E-Mail-Adresse',
            rowIndex: 0,
            required: true,
          },
          {
            component: 'input',
            label: 'Vollständiger Name',
            rowIndex: 1,
            required: true,
          },
        ],
      });

      const updateTitle = () => (form.formCategory = 'screening');
      expect(updateTitle).toThrowError(TypeError);
    });
  });

  describe('parameter validation', () => {
    it('prohibits formTitle for application form', () => {
      const create = () => {
        createForm({
          tenantId: uuid(),
          jobId: uuid(),
          formCategory: 'application',
          formTitle: 'Application Form',
          formFields: [
            {
              component: 'input',
              label: 'E-Mail-Adresse',
              rowIndex: 0,
              required: true,
            },
            {
              component: 'input',
              label: 'Vollständiger Name',
              rowIndex: 1,
              required: true,
            },
          ],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('prohibits formTitle for screening form', () => {
      const create = () => {
        createForm({
          tenantId: uuid(),
          jobId: uuid(),
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
          tenantId: uuid(),
          jobId: uuid(),
          formCategory: 'assessment',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('requires formTitle for onboarding form', () => {
      const create = () => {
        createForm({
          tenantId: uuid(),
          jobId: uuid(),
          formCategory: 'onboarding',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });

    it('requires email and name field for application form', () => {
      const create = () => {
        createForm({
          tenantId: uuid(),
          jobId: uuid(),
          formCategory: 'application',
          formFields: [],
        });
      };

      expect(create).toThrowError(ValidationError);
    });
  });
});