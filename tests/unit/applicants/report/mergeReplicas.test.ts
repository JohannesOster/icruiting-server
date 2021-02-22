import {mergeReplicas} from 'application/applicants/calcReport/mergeReplicas';

describe('mergereplicas', () => {
  it('does nothing if there are not replicas', () => {
    const report = {
      formFieldScores: {
        applicant1: {form1: {formField1: {mean: 0, stdDev: 0}}},
      },
      formScores: {applicant1: {form1: {mean: 0, stdDev: 0}}},
      formCategoryScores: {applicant1: 0},
      aggregates: {applicant1: {form1: {formField2: []}}},
      countDistinct: {applicant1: {form1: {formField2: {}}}},
      jobRequirements: {applicant1: {jobRequirement1: 0}},
    };
    const forms = {};
    const expected = report;

    expect(mergeReplicas(report, forms)).toStrictEqual(expected);
  });
});
