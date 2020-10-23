import {buildReport} from '../repos/utils';
import {
  createFormField,
  createRankingRow,
  createSubmission,
} from '../factories';
import {mean, standardDeviation, round} from 'db/math';

describe('database repositories', () => {
  describe('round', () => {
    it('rounds default to 2 digits', () => {
      const numb = 1.234;
      const result = round(numb);
      expect(result).toBe(1.23);
    });
    it('rounds default to provided digits', () => {
      const numb = 1.2345678;
      const result = round(numb, 3);
      expect(result).toBe(1.235);
    });
  });

  describe('math', () => {
    it('calculates mean correctly', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('calculates standard deviation correctly', () => {
      expect(standardDeviation([1, 2, 3])).toBe(1);
    });
  });

  describe('buildReport', () => {
    it('builds mean for sumUp formField', () => {
      const formField = createFormField('sum_up');
      const submissions = [
        createSubmission([formField]),
        createSubmission([formField]),
      ];

      const row = createRankingRow(submissions);

      const sum = row.submissions.reduce(
        (mean, fields) => mean + +fields[0].value,
        0,
      );
      const mean = sum / row.submissions.length;

      const res = buildReport(row);
      expect((res.result[formField.formFieldId] as any).value).toBe(mean);
    });

    it('builds mean for the jobRequirements', () => {
      const requirement = 'Teamfit';
      const formField = createFormField('sum_up', requirement);

      const submissions = [
        createSubmission([formField]),
        createSubmission([formField]),
      ];

      const row = createRankingRow(submissions);

      const sum = row.submissions.reduce(
        (mean, fields) => mean + +fields[0].value,
        0,
      );
      const mean = sum / row.submissions.length;

      const res = buildReport(row);
      expect(res.jobRequirementsResult[requirement]).toBe(mean);
    });
  });
});
