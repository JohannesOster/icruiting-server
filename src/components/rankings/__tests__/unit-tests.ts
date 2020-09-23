import {random} from 'faker';
import {sumUpjobRequirementsScore} from '../utils';
import {randomElement} from 'utils';
import {EFormItemIntent} from '../types';

describe('rankings', () => {
  describe('sumUpjobRequirementsScore', () => {
    it('Builds correct sum over job_requirements', () => {
      const randArray = Array(random.number({min: 5, max: 15})).fill(0);
      const jobRequirements = randArray.map(() => random.uuid());

      const submissions = randArray.map(() =>
        randArray.map(() => ({
          form_field_id: random.uuid(),
          value: random.number({min: 1, max: 5}),
          job_requirement_id: randomElement(jobRequirements),
          intent: EFormItemIntent.sumUp,
          label: '',
        })),
      );

      const expectedResult = submissions.reduce((acc, curr) => {
        curr.forEach((field) => {
          const key = field.job_requirement_id;
          const value = field.value;
          if (!key) return acc;
          acc[key] = acc[key] ? acc[key] + value : value;
          return acc;
        });
        return acc;
      }, {} as any);

      const result = sumUpjobRequirementsScore(submissions);
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
