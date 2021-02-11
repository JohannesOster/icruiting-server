import {filterFormData, reduceSubmissions} from '../preprocessor';
import {random} from 'faker';
import {EFormCategory} from 'db/repos/forms';
import {FormFieldIntent} from '../../types';

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
        formCategory: 'assessment' as EFormCategory,
        jobTitle: random.word(),
        requirementLabel: random.word(),
        jobRequirementId: random.uuid(),
      };

      const res = filterFormData([mockRow]);
      const field = res[mockRow.formId][mockRow.formFieldId];
      expect(field.intent).toEqual(mockRow.intent);
      expect(field.jobRequirementId).toEqual(mockRow.jobRequirementId);
      expect(field.label).toEqual(mockRow.label);
      expect(field.options).toStrictEqual(mockRow.options);
      expect(field.rowIndex).toEqual(mockRow.rowIndex);
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
        formCategory: 'assessment' as EFormCategory,
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
