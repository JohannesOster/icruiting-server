import {createReport} from 'modules/applicants/application/calcReport/report';

describe('CreateReport', () => {
  it('rounds results', () => {
    const applicantId = 'applicant';
    const scores = {
      formFieldScores: {
        applicant: {form1: {formField1: {mean: 0.123, stdDev: 0.425}}},
      },
      formScores: {applicant: {form1: {mean: 0.123}}},
      formCategoryScores: {applicant: 0.123},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formCategory: 'assessment',
        formTitle: 'formTitle',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
        formFields: {
          formField1: {label: 'formField', intent: 'sum_up', rowIndex: 0},
        },
      },
    };
    const jobRequirements = {
      jobRequirement1: {requirementLabel: 'requirement1'},
    };

    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({
      rank: 1,
      formCategory: 'assessment',
      formCategoryScore: 0.12,
      formResults: [
        {
          formId: 'form1',
          formTitle: 'formTitle',
          formScore: 0.12,
          possibleMinFormScore: 0,
          possibleMaxFormScore: 4,
          formFieldScores: [
            {
              formFieldId: 'formField1',
              label: 'formField',
              intent: 'sum_up',
              rowIndex: 0,
              formFieldScore: 0.12,
              stdDevFormFieldScore: 0.43,
              aggregatedValues: [],
              countDistinct: {},
            },
          ],
        },
      ],
      jobRequirementResults: [],
    });
  });

  it('Only displays used jobRequirement', () => {
    const applicantId = 'applicant';
    const scores = {
      formFieldScores: {
        applicant: {form1: {formField1: {mean: 3.245, stdDev: 0.425}}},
      },
      formScores: {applicant: {form1: {mean: 3.245}}},
      formCategoryScores: {applicant: 3.245},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {
        applicant: {jobRequirement1: 3.245},
      },
    };
    const forms = {
      form1: {
        formCategory: 'assessment',
        formTitle: 'formTitle',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
        formFields: {
          formField1: {label: 'formField', intent: 'sum_up', rowIndex: 0},
        },
      },
    };
    const jobRequirements = {
      jobRequirement1: {requirementLabel: 'requirement1'},
      jobRequirement2: {requirementLabel: 'requirement2'},
    };

    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({
      rank: 1,
      formCategory: 'assessment',
      formCategoryScore: 3.25,
      formResults: [
        {
          formId: 'form1',
          formTitle: 'formTitle',
          formScore: 3.25,
          possibleMinFormScore: 0,
          possibleMaxFormScore: 4,
          formFieldScores: [
            {
              formFieldId: 'formField1',
              label: 'formField',
              intent: 'sum_up',
              rowIndex: 0,
              formFieldScore: 3.25,
              stdDevFormFieldScore: 0.43,
              aggregatedValues: [],
              countDistinct: {},
            },
          ],
        },
      ],
      jobRequirementResults: [
        {
          jobRequirementId: 'jobRequirement1',
          requirementLabel: 'requirement1',
          jobRequirementScore: 3.25,
        },
      ],
    });
  });

  it('displays results even if not sum_up fields are included', () => {
    const applicantId = 'applicant';
    const scores = {
      formFieldScores: {},
      formScores: {},
      formCategoryScores: {},
      aggregates: {applicant: {form1: {formField1: ['This is my comment']}}},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formCategory: 'assessment',
        formTitle: 'formTitle',
        possibleMaxFormScore: 0,
        possibleMinFormScore: 0,
        formFields: {
          formField1: {label: 'formField', intent: 'aggregate', rowIndex: 0},
        },
      },
    };
    const jobRequirements = {
      jobRequirement1: {requirementLabel: 'requirement1'},
    };

    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({
      rank: 0, // since there are no sum_up_fields
      formCategory: 'assessment',
      formResults: [
        {
          formId: 'form1',
          formTitle: 'formTitle',
          possibleMaxFormScore: 0,
          possibleMinFormScore: 0,
          formFieldScores: [
            {
              formFieldId: 'formField1',
              label: 'formField',
              intent: 'aggregate',
              rowIndex: 0,
              formFieldScore: null,
              stdDevFormFieldScore: null,
              aggregatedValues: ['This is my comment'],
              countDistinct: {},
            },
          ],
        },
      ],
      jobRequirementResults: [],
    });
  });

  it('does nothing with empty scores', () => {
    const applicantId = 'applicant';
    const scores = {
      formFieldScores: {},
      formScores: {},
      formCategoryScores: {},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {};
    const jobRequirements = {};

    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({rank: 0});
  });

  it('separates replicas correctly', () => {
    const applicantId = 'applicant';

    const formFields = {
      formField1: {label: 'formField', intent: 'sum_up', rowIndex: 0},
      formField2: {label: 'formField', intent: 'count_distinct', rowIndex: 1},
      formField3: {label: 'formField', intent: 'aggregate', rowIndex: 2},
    };

    const forms = {
      form1: {
        formCategory: 'onboarding',
        formTitle: 'formTitle',
        formFields,
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
      },
      form2: {
        formCategory: 'onboarding',
        formTitle: 'formTitle2',
        formFields,
        replicaOf: 'form1',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
      },
    };
    const jobRequirements = {};

    const scores = {
      formFieldScores: {
        [applicantId]: {
          form1: {
            formField1: {mean: 6, stdDev: 2},
            replicas: {
              form1: {formField1: {mean: 2, stdDev: 0}},
              form2: {formField1: {mean: 8, stdDev: 0}},
            } as any,
          },
        },
      },
      aggregates: {
        [applicantId]: {
          form1: {
            formField2: ['a', 'b'],
            replicas: {
              form1: {formField2: ['a']},
              form2: {formField2: ['b']},
            } as any,
          },
        },
      },
      countDistinct: {
        [applicantId]: {
          form1: {
            formField3: {a: 1, b: 3},
            replicas: {
              form1: {formField3: {a: 1}},
              form2: {formField3: {a: 1, b: 2}},
            } as any,
          },
        },
      },
      formScores: {
        [applicantId]: {
          form1: {
            mean: 6,
            stdDev: 2,
            replicas: {
              form1: {mean: 2},
              form2: {mean: 8},
            },
          },
        },
      },
      formCategoryScores: {[applicantId]: 6},
      jobRequirements: {},
    };

    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({
      formCategory: 'onboarding',
      formResults: [
        {
          formId: 'form1',
          formTitle: forms.form1.formTitle,
          formScore: 6,
          possibleMinFormScore: 0,
          possibleMaxFormScore: 4,
          formFieldScores: [
            {
              formFieldId: 'formField1',
              ...formFields.formField1,
              formFieldScore: 6,
              stdDevFormFieldScore: 2,
              aggregatedValues: [],
              countDistinct: {},
            },
            {
              formFieldId: 'formField2',
              ...formFields.formField2,
              formFieldScore: null,
              stdDevFormFieldScore: null,
              aggregatedValues: ['a', 'b'],
              countDistinct: {},
            },
            {
              formFieldId: 'formField3',
              ...formFields.formField3,
              formFieldScore: null,
              stdDevFormFieldScore: null,
              aggregatedValues: [],
              countDistinct: {a: 1, b: 3},
            },
          ],
          replicas: [
            {
              formId: 'form1',
              formTitle: forms.form1.formTitle,
              formScore: 2,
              possibleMinFormScore: 0,
              possibleMaxFormScore: 4,
              formFieldScores: [
                {
                  formFieldId: 'formField1',
                  ...formFields.formField1,
                  formFieldScore: 2,
                  stdDevFormFieldScore: 0,
                  aggregatedValues: [],
                  countDistinct: {},
                },
                {
                  formFieldId: 'formField2',
                  ...formFields.formField2,
                  aggregatedValues: ['a'],
                  countDistinct: {},
                  formFieldScore: null,
                  stdDevFormFieldScore: null,
                },
                {
                  formFieldId: 'formField3',
                  ...formFields.formField3,
                  formFieldScore: null,
                  stdDevFormFieldScore: null,
                  aggregatedValues: [],
                  countDistinct: {a: 1},
                },
              ],
            },
            {
              formId: 'form2',
              formTitle: forms.form2.formTitle,
              formScore: 8,
              possibleMinFormScore: 0,
              possibleMaxFormScore: 4,
              formFieldScores: [
                {
                  formFieldId: 'formField1',
                  ...formFields.formField1,
                  formFieldScore: 8,
                  stdDevFormFieldScore: 0,
                  aggregatedValues: [],
                  countDistinct: {},
                },
                {
                  formFieldId: 'formField2',
                  ...formFields.formField2,
                  aggregatedValues: ['b'],
                  countDistinct: {},
                  formFieldScore: null,
                  stdDevFormFieldScore: null,
                },
                {
                  formFieldId: 'formField3',
                  ...formFields.formField3,
                  formFieldScore: null,
                  stdDevFormFieldScore: null,
                  aggregatedValues: [],
                  countDistinct: {a: 1, b: 2},
                },
              ],
            },
          ],
        },
      ],
      jobRequirementResults: [],
    });
  });

  it('removes rank and formCategoryScore in onboarding', () => {
    const applicantId = 'applicant';
    const scores = {
      formFieldScores: {
        [applicantId]: {form1: {formField1: {mean: 5, stdDev: 0}}},
      },
      formScores: {[applicantId]: {form1: {mean: 5}}},
      formCategoryScores: {[applicantId]: 5},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formCategory: 'onboarding',
        formTitle: 'formTitle',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
        formFields: {
          formField1: {label: 'formField', intent: 'sum_up', rowIndex: 0},
        },
      },
    };
    const jobRequirements = {};

    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({
      formCategory: 'onboarding',
      formResults: [
        {
          formFieldScores: [
            {
              formFieldId: 'formField1',
              ...forms.form1.formFields.formField1,
              formFieldScore: 5,
              stdDevFormFieldScore: 0,
              aggregatedValues: [],
              countDistinct: {},
            },
          ],
          formId: 'form1',
          formScore: 5,
          formTitle: 'formTitle',
          possibleMinFormScore: 0,
          possibleMaxFormScore: 4,
        },
      ],
      jobRequirementResults: [],
    });
  });

  it('filters missing formSubmissions', () => {
    const applicantId = 'applicant';
    const applicantId2 = 'applicantId2';
    const scores = {
      formFieldScores: {
        [applicantId]: {
          form1: {formField1: {mean: 5, stdDev: 0}},
          form2: {formField2: {mean: 5, stdDev: 0}},
        },
        [applicantId2]: {
          form1: {formField1: {mean: 5, stdDev: 0}},
          // Note form 2 is missing
        },
      },
      formScores: {
        [applicantId]: {
          form1: {mean: 5},
          form2: {mean: 5},
        },
        [applicantId2]: {form1: {mean: 5}},
      },
      formCategoryScores: {[applicantId]: 10, [applicantId2]: 5},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formCategory: 'onboarding',
        formTitle: 'formTitle',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
        formFields: {
          formField1: {label: 'formField', intent: 'sum_up', rowIndex: 0},
        },
      },
      form2: {
        formCategory: 'onboarding',
        formTitle: 'formTitle',
        possibleMinFormScore: 0,
        possibleMaxFormScore: 4,
        formFields: {
          formField2: {label: 'formField', intent: 'sum_up', rowIndex: 0},
        },
      },
    };
    const jobRequirements = {};

    const report = createReport(applicantId2, scores, forms, jobRequirements);
    expect(report).toStrictEqual({
      formCategory: 'onboarding',
      formResults: [
        {
          formFieldScores: [
            {
              formFieldId: 'formField1',
              ...forms.form1.formFields.formField1,
              formFieldScore: 5,
              stdDevFormFieldScore: 0,
              aggregatedValues: [],
              countDistinct: {},
            },
          ],
          formId: 'form1',
          formScore: 5,
          formTitle: 'formTitle',
          possibleMinFormScore: 0,
          possibleMaxFormScore: 4,
        },
      ],
      jobRequirementResults: [],
    });
  });
});
