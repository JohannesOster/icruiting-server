import {
  filterFormData,
  reduceSubmissions,
} from 'application/applicants/calcReport/preprocessor';
import {random} from 'faker';
import {FormCategory, FormFieldIntent} from 'domain/entities';

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
      expect(form[mockRow.formId].formCategory).toEqual(mockRow.formCategory);
    });

    it('filters forms even if no sum_up field is included', () => {
      const mockRow = {
        submitterId: random.uuid(),
        applicantId: random.uuid(),
        submissionValue: random.words(),
        formFieldId: random.uuid(),
        intent: 'aggregate' as FormFieldIntent,
        rowIndex: 0,
        label: random.words(),
        formId: random.uuid(),
        formTitle: random.word(),
        formCategory: 'assessment' as FormCategory,
        jobTitle: random.word(),
        requirementLabel: random.word(),
        jobRequirementId: random.uuid(),
      };

      const [form] = filterFormData([mockRow]);
      expect(form[mockRow.formId].formTitle).toEqual(mockRow.formTitle);
      expect(form[mockRow.formId].formCategory).toEqual(mockRow.formCategory);
    });

    it('calculates possible min-max form scores', () => {
      const {uuid, number, word, words} = random;
      const mockRow = {
        submitterId: uuid(),
        applicantId: uuid(),
        submissionValue: number().toString(),
        formFieldId: uuid(),
        intent: 'sum_up' as FormFieldIntent,
        rowIndex: 0,
        label: words(),
        options: [
          {label: '0', value: '0'},
          {label: '1', value: '1'},
          {label: '2', value: '2'},
          {label: '3', value: '3'},
          {label: '4', value: '4'},
        ],
        formId: uuid(),
        formTitle: word(),
        formCategory: 'assessment' as FormCategory,
        jobTitle: word(),
        requirementLabel: word(),
        jobRequirementId: uuid(),
      };

      const data = [mockRow, {...mockRow, rowIndex: 1, formFieldId: uuid()}];
      const [form] = filterFormData(data);
      expect(form[mockRow.formId].possibleMinFormScore).toEqual(0);
      expect(form[mockRow.formId].possibleMaxFormScore).toEqual(8); // 2*4
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
