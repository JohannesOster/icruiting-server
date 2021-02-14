import {
  filterFormData,
  reduceSubmissions,
} from 'adapters/applicants/report/preprocessor';
import {random} from 'faker';
import {FormFieldIntent} from 'adapters/applicants/report/types';
import {FormCategory} from 'domain/entities';

describe('preprocessor', () => {
  describe('filterFormData', () => {
    it('filters formField information', () => {
      const mockRow = {
        submitterId: random.uuid(),
        applicantId: random.uuid(),
        submissionValue: random.number().toString(),
        formFieldId: random.uuid(),
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 0,
        label: random.words(),
        options: [
          {label: '0', value: '0'},
          {label: '1', value: '1'},
          {label: '2', value: '2'},
          {label: '3', value: '3'},
          {label: '4', value: '4'},
        ],
        formId: random.uuid(),
        formTitle: random.word(),
        formCategory: 'assessment' as FormCategory,
        jobTitle: random.word(),
        requirementLabel: random.word(),
        jobRequirementId: random.uuid(),
      };

      const [form, formFields] = filterFormData([mockRow]);
      const field = formFields[mockRow.formId][mockRow.formFieldId];
      expect(field.intent).toEqual(mockRow.intent);
      expect(field.jobRequirementId).toEqual(mockRow.jobRequirementId);
      expect(field.label).toEqual(mockRow.label);
      expect(field.options).toStrictEqual(mockRow.options);
      expect(field.rowIndex).toEqual(mockRow.rowIndex);

      expect(form[mockRow.formId].formTitle).toEqual(mockRow.formTitle);
    });
  });
  describe('reduceSubmissions', () => {
    it('transforms submission row to nested object', () => {
      const mockRow = {
        submitterId: random.uuid(),
        applicantId: random.uuid(),
        submissionValue: random.number().toString(),
        formFieldId: random.uuid(),
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 0,
        label: random.words(),
        options: [
          {label: '0', value: '0'},
          {label: '1', value: '1'},
          {label: '2', value: '2'},
          {label: '3', value: '3'},
          {label: '4', value: '4'},
        ],
        formId: random.uuid(),
        formTitle: random.word(),
        formCategory: 'assessment' as FormCategory,
        jobTitle: random.word(),
        requirementLabel: random.word(),
        jobRequirementId: random.uuid(),
      };

      const res = reduceSubmissions([mockRow]);
      const field =
        res[mockRow.applicantId][mockRow.submitterId][mockRow.formId][
          mockRow.formFieldId
        ];
      expect(field).toStrictEqual(mockRow.submissionValue);
    });
  });
});
