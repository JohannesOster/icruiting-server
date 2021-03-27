import _ from 'lodash';
import {mergeReplicas} from 'application/applicants/calcReport/mergeReplicas';

describe('mergereplicas', () => {
  it('does nothing if there are not replicas', () => {
    const report = {
      formFieldScores: {
        applicant1: {form1: {formField1: {mean: 1, stdDev: 1}}},
      },
      formScores: {applicant1: {form1: {mean: 1, stdDev: 1}}},
      formCategoryScores: {applicant1: 1},
      aggregates: {applicant1: {form1: {formField2: []}}},
      countDistinct: {applicant1: {form1: {formField2: {}}}},
      jobRequirements: {applicant1: {jobRequirement1: 1}},
    };
    const forms = {
      form1: {
        formTitle: 'form1',
        formCategory: 'onboarding',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
      },
    };
    const expected = _.cloneDeep(report); // otherwise expected will be modified as well, therefore test would always pass

    expect(mergeReplicas(report, forms)).toStrictEqual(expected);
  });
  it('Merges replica scores', () => {
    const report = {
      formFieldScores: {
        applicant1: {
          form1: {
            formField1: {mean: 0, stdDev: 0},
            formField2: {mean: 4, stdDev: 0},
          },
          form2: {
            formField1: {mean: 2, stdDev: 0},
            formField2: {mean: 2, stdDev: 0},
          },
        },
      },
      formScores: {
        applicant1: {form1: {mean: 2, stdDev: 2}, form2: {mean: 2, stdDev: 0}},
      },
      formCategoryScores: {applicant1: 2},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formTitle: 'formTitle',
        formCategory: 'onboarding',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 8,
      },
      form2: {
        formTitle: 'formTitle2',
        formCategory: 'onboarding',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 8,
        replicaOf: 'form1',
      },
    };
    const expected = {
      ..._.cloneDeep(report),
      formFieldScores: {
        applicant1: {
          form1: {
            formField1: {mean: 1, stdDev: 1},
            formField2: {mean: 3, stdDev: 1},
            replicas: {
              form1: {
                formField1: {mean: 0, stdDev: 0},
                formField2: {mean: 4, stdDev: 0},
              },
              form2: {
                formField1: {mean: 2, stdDev: 0},
                formField2: {mean: 2, stdDev: 0},
              },
            },
          },
        },
      },
      formScores: {
        applicant1: {
          form1: {
            mean: 2,
            stdDev: 0,
            replicas: {
              form1: {mean: 2, stdDev: 2},
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
      form1: {
        formTitle: 'formTitle',
        formCategory: 'onboarding',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
      },
      form2: {
        formTitle: 'formTitle2',
        formCategory: 'onboarding',
        replicaOf: 'form1',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
      },
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

  it('Merges replica countDistinct', () => {
    const report = {
      formFieldScores: {},
      formScores: {},
      formCategoryScores: {},
      aggregates: {},
      countDistinct: {
        applicant1: {
          form1: {
            formField1: {'Option 0': 1, 'Option 1': 1},
            formFieldId2: {'Option 0': 1},
          },
          form2: {
            formField1: {'Option 1': 1, 'Option 2': 1},
            formFieldId2: {'Option 0': 1},
          },
        },
      },
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formTitle: 'formTitle',
        formCategory: 'onboarding',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
      },
      form2: {
        formTitle: 'formTitle2',
        formCategory: 'onboarding',
        replicaOf: 'form1',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
      },
    };
    const expected = {
      ...report,
      countDistinct: {
        applicant1: {
          form1: {
            formField1: {'Option 0': 1, 'Option 1': 2, 'Option 2': 1},
            formFieldId2: {'Option 0': 2},
            replicas: {
              form1: {
                formField1: {'Option 0': 1, 'Option 1': 1},
                formFieldId2: {'Option 0': 1},
              },
              form2: {
                formField1: {'Option 1': 1, 'Option 2': 1},
                formFieldId2: {'Option 0': 1},
              },
            },
          },
        },
      },
    };

    expect(mergeReplicas(report, forms)).toStrictEqual(expected);
  });

  it('Merges replicas if primary form is not submitted', () => {
    const report = {
      formFieldScores: {
        applicant1: {
          form1: {formField1: {mean: 2, stdDev: 0}},
          form2: {formField1: {mean: 4, stdDev: 0}},
        },
        applicant2: {form2: {formField1: {mean: 4, stdDev: 0}}},
      },
      formScores: {
        applicant1: {
          form1: {mean: 2, stdDev: 0},
          form2: {mean: 4, stdDev: 0},
        },
        applicant2: {form2: {mean: 4, stdDev: 0}},
      },
      formCategoryScores: {applicant1: 3, applicant2: 4},
      jobRequirements: {},
      countDistinct: {},
      aggregates: {},
    };

    const forms = {
      form1: {
        formTitle: 'formTitle1',
        formCategory: 'onboarding',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
      },
      form2: {
        formTitle: 'formTitle2',
        formCategory: 'onboarding',
        replicaOf: 'form1',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 0,
      },
    };

    const expected = {
      formFieldScores: {
        applicant1: {
          form1: {
            formField1: {mean: 3, stdDev: 1},
            replicas: {
              form1: {formField1: {mean: 2, stdDev: 0}},
              form2: {formField1: {mean: 4, stdDev: 0}},
            },
          },
        },
        applicant2: {
          form1: {
            replicas: {form2: {formField1: {mean: 4, stdDev: 0}}},
            formField1: {mean: 4, stdDev: 0},
          },
        },
      },
      formScores: {
        applicant1: {
          form1: {
            mean: 3,
            stdDev: 1,
            replicas: {
              form1: {mean: 2, stdDev: 0},
              form2: {mean: 4, stdDev: 0},
            },
          },
        },
        applicant2: {
          form1: {
            replicas: {form2: {mean: 4, stdDev: 0}},
            mean: 4,
            stdDev: 0,
          },
        },
      },
      formCategoryScores: {applicant1: 3, applicant2: 4},
      jobRequirements: {},
      countDistinct: {},
      aggregates: {},
    };

    expect(mergeReplicas(report, forms)).toStrictEqual(expected);
  });
});
