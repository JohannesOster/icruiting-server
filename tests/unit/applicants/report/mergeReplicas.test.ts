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
  it('Merges replica scores', () => {
    const report = {
      formFieldScores: {
        applicant1: {
          form1: {formField1: {mean: 0, stdDev: 0}},
          form2: {formField1: {mean: 2, stdDev: 0}},
        },
      },
      formScores: {
        applicant1: {form1: {mean: 0, stdDev: 0}, form2: {mean: 2, stdDev: 0}},
      },
      formCategoryScores: {applicant1: 1},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {formTitle: 'formTitle'},
      form2: {formTitle: 'formTitle2', replicaOf: 'form1'},
    };
    const expected = {
      ...report,
      formFieldScores: {
        applicant1: {
          form1: {
            formField1: {mean: 1, stdDev: 1},
            replicas: {
              form1: {formField1: {mean: 0, stdDev: 0}},
              form2: {formField1: {mean: 2, stdDev: 0}},
            },
          },
        },
      },
      formScores: {
        applicant1: {
          form1: {
            mean: 1,
            stdDev: 1,
            replicas: {
              form1: {mean: 0, stdDev: 0},
              form2: {mean: 2, stdDev: 0},
            },
          },
        },
      },
    };

    expect(mergeReplicas(report, forms)).toStrictEqual(expected);
  });

  it('Merges replica aggregations', () => {
    const report = {
      formFieldScores: {},
      formScores: {},
      formCategoryScores: {},
      aggregates: {
        applicant1: {
          form1: {formField1: ['a', 'b']},
          form2: {formField1: ['c']},
        },
      },
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {formTitle: 'formTitle'},
      form2: {formTitle: 'formTitle2', replicaOf: 'form1'},
    };
    const expected = {
      ...report,
      aggregates: {
        applicant1: {
          form1: {
            formField1: ['a', 'b', 'c'],
            replicas: {
              form1: {formField1: ['a', 'b']},
              form2: {formField1: ['c']},
            },
          },
        },
      },
    };

    expect(mergeReplicas(report, forms)).toStrictEqual(expected);
  });
});
