import {FormFieldIntent} from 'db/repos/utils';
import {random} from 'faker';
import {reduceFormSubmissions} from '../utils';

describe('reduceFormSubmissions', () => {
  it('calculates report', () => {
    const mockSubmissions = [
      [
        {
          formFieldId: random.uuid(),
          jobRequirementLabel: 'Ganzheitliches Denken',
          intent: 'sum_up' as FormFieldIntent,
          value: '4',
        },
        {
          formFieldId: random.uuid(),
          jobRequirementLabel: 'Kreativität',
          intent: 'sum_up' as FormFieldIntent,
          value: '4',
        },
      ],
      [
        {
          formFieldId: random.uuid(),
          jobRequirementLabel: 'Ganzheitliches Denken',
          intent: 'sum_up' as FormFieldIntent,
          value: '0',
        },
        {
          formFieldId: random.uuid(),
          jobRequirementLabel: 'Kreativität',
          intent: 'sum_up' as FormFieldIntent,
          value: '0',
        },
      ],
    ];

    const report = reduceFormSubmissions(mockSubmissions);
    expect(report.jobRequirementResults['Gazheitliches Denken']).toBe(2);
    expect(report.jobRequirementResults['Kreativität']).toBe(2);

    expect(report.score).toBe(4);
  });
});
