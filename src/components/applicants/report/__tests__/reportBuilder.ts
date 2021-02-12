import {ReportBuilder} from '../reportBuilder';

describe('ReportBuilder', () => {
  const options = ['0', '1', '2', '3', '4'].map((s) => ({
    label: s,
    value: s,
  }));
  describe('score', () => {
    const forms = {
      form1: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          options: options,
          rowIndex: 0,
          label: '',
          jobRequirementId: '',
        },
        formField2: {
          intent: 'sum_up' as 'sum_up',
          options: options,
          rowIndex: 1,
          label: '',
          jobRequirementId: '',
        },
      },
      form2: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          options: options,
          rowIndex: 0,
          label: '',
          jobRequirementId: '',
        },
      },
    };
    const submissions = {
      applicant1: {
        submitter1: {
          form1: {formField1: '4', formField2: '0'},
          form2: {formField1: '1'},
        },
        submitter2: {form1: {formField1: '2', formField2: '4'}},
      },
      applicant2: {submitter1: {form1: {formField1: '4', formField2: '0'}}},
    };

    it('calculates formFieldScores correctly', () => {
      const report = ReportBuilder(forms, submissions);
      const expected = {
        applicant1: {
          form1: {
            formField1: {mean: 3, stdDev: 1},
            formField2: {mean: 2, stdDev: 2},
          },
          form2: {formField1: {mean: 1, stdDev: 0}},
        },
        applicant2: {
          form1: {
            formField1: {mean: 4, stdDev: 0},
            formField2: {mean: 0, stdDev: 0},
          },
        },
      };

      expect(report.formFieldScores).toStrictEqual(expected);
    });
    it('calculates formScores correctly', () => {
      const report = ReportBuilder(forms, submissions);
      expect(report.formScores).toStrictEqual({
        applicant1: {form1: {mean: 5, stdDev: 1}, form2: {mean: 1, stdDev: 0}},
        applicant2: {form1: {mean: 4, stdDev: 0}},
      });
    });

    it('calculates formCategoryScore correctly', () => {
      const report = ReportBuilder(forms, submissions);
      expect(report.formCategoryScores).toStrictEqual({
        applicant1: 3,
        applicant2: 4,
      });
    });
  });
  describe('aggregation', () => {
    const forms = {
      form1: {
        formField1: {
          intent: 'aggregate' as 'aggregate',
          rowIndex: 0,
          label: '',
        },
        formField2: {
          intent: 'aggregate' as 'aggregate',
          rowIndex: 1,
          label: '',
        },
      },
      form2: {
        formField1: {
          intent: 'aggregate' as 'aggregate',
          rowIndex: 0,
          label: '',
        },
      },
    };
    const submissions = {
      applicant1: {
        submitter1: {
          form1: {formField1: 'Anmerkung 1', formField2: 'Anmerkung 2'},
          form2: {formField1: 'Anmerkung 3'},
        },
        submitter2: {
          form1: {formField1: 'Anmerkung 4', formField2: 'Anmerkung 5'},
        },
      },
      applicant2: {
        submitter1: {
          form1: {formField1: 'Anmerkung 6', formField2: 'Anmerkung 7'},
        },
      },
    };
    it('aggregates values correctly', () => {
      const report = ReportBuilder(forms, submissions);
      const expected = {
        applicant1: {
          form1: {
            formField1: ['Anmerkung 1', 'Anmerkung 4'],
            formField2: ['Anmerkung 2', 'Anmerkung 5'],
          },
          form2: {formField1: ['Anmerkung 3']},
        },
        applicant2: {
          form1: {formField1: ['Anmerkung 6'], formField2: ['Anmerkung 7']},
        },
      };
      expect(report.aggregates).toEqual(expected);
    });
  });
  describe('jobRequirementResults', () => {
    const forms = {
      form1: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          options: options,
          rowIndex: 0,
          label: '',
          jobRequirementId: 'DdUJWo',
        },
        formField2: {
          intent: 'sum_up' as 'sum_up',
          rowIndex: 1,
          options: options,
          label: '',
          jobRequirementId: 'DKBfVT',
        },
      },
      form2: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          rowIndex: 0,
          options: options,
          label: '',
          jobRequirementId: 'DdUJWo',
        },
        formField2: {
          intent: 'aggregate' as 'aggregate',
          rowIndex: 1,
          label: '',
        },
      },
    };
    const submissions = {
      applicant1: {
        submitter1: {
          form1: {formField1: '0', formField2: '4'},
          form2: {formField1: '1', formField2: 'Anmerkung 1'},
        },
        submitter2: {form1: {formField1: '2', formField2: '3'}},
      },
      applicant2: {
        submitter1: {form2: {formField1: '3', formField2: 'Anmerkung 2'}},
      },
    };

    it('scores jobRequirement correctly', () => {
      const report = ReportBuilder(forms, submissions);
      const expected = {
        applicant1: {DdUJWo: 1, DKBfVT: 3.5},
        applicant2: {DdUJWo: 3, DKBfVT: 0},
      };
      expect(report.jobRequirements).toEqual(expected);
    });
  });
});
