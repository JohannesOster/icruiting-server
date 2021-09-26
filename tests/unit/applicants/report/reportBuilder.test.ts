import {ReportBuilder} from 'modules/applicants/application/calcReport/reportBuilder';

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
          options,
          rowIndex: 0,
          label: '',
          jobRequirementId: '',
        },
        formField2: {
          intent: 'sum_up' as 'sum_up',
          options,
          rowIndex: 1,
          label: '',
          jobRequirementId: '',
        },
      },
      form2: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          options,
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
        applicant1: {form1: {mean: 5}, form2: {mean: 1}},
        applicant2: {form1: {mean: 4}},
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
          options,
          rowIndex: 0,
          label: '',
          jobRequirementId: 'DdUJWo',
        },
        formField2: {
          intent: 'sum_up' as 'sum_up',
          rowIndex: 1,
          options,
          label: '',
          jobRequirementId: 'DKBfVT',
        },
      },
      form2: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          rowIndex: 0,
          options,
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

  describe('count_distinct', () => {
    const options = ['0', '1', '2', '3', '4'].map((s) => ({
      label: `Option ${s}`,
      value: s,
    }));

    const forms = {
      form1: {
        formField1: {
          intent: 'count_distinct' as 'count_distinct',
          rowIndex: 0,
          options,
          label: '',
        },
      },
      form2: {
        formField1: {
          intent: 'count_distinct' as 'count_distinct',
          rowIndex: 0,
          options,
          label: '',
        },
      },
    };
    const submissions = {
      applicant1: {
        submitter1: {form1: {formField1: '0'}, form2: {formField1: '1'}},
        submitter2: {form1: {formField1: '0'}},
      },
      applicant2: {
        submitter1: {form1: {formField1: '0'}},
        submitter2: {form1: {formField1: '1'}},
      },
    };
    it('counts values correctly', () => {
      const report = ReportBuilder(forms, submissions);
      const expected = {
        applicant1: {
          form1: {formField1: {'Option 0': 2}},
          form2: {formField1: {'Option 1': 1}},
        },
        applicant2: {
          form1: {formField1: {'Option 0': 1, 'Option 1': 1}},
        },
      };
      expect(report.countDistinct).toEqual(expected);
    });
  });

  describe('formScore', () => {
    const options = ['0', '1', '2', '3', '4'].map((s) => ({
      label: s,
      value: s,
    }));

    const forms = {
      form1: {
        formField1: {
          intent: 'sum_up' as 'sum_up',
          rowIndex: 0,
          options,
          label: '',
        },
        formField2: {
          intent: 'aggregate' as 'aggregate',
          rowIndex: 1,
          label: '',
        },
        formField3: {
          intent: 'count_distinct' as 'count_distinct',
          options,
          rowIndex: 1,
          label: '',
        },
      },
    };
    const submissions = {
      applicant1: {
        submitter1: {
          form1: {formField1: '0', formField2: '1', formField3: '2'},
        },
      },
    };
    it('only uses intent = sum_up formScore', () => {
      const report = ReportBuilder(forms, submissions);
      const expected = {applicant1: {form1: {mean: 0}}};
      expect(report.formScores).toEqual(expected);
    });
  });

  describe('missing form_submissions', () => {
    const options = ['0', '1', '2', '3', '4'].map((s) => ({
      label: s,
      value: s,
    }));

    const sumUp = 'sum_up' as 'sum_up';
    const countDistinct = 'count_distinct' as 'count_distinct';
    const aggregate = 'aggregate' as 'aggregate';
    const forms = {
      form1: {
        formField1: {intent: sumUp, rowIndex: 0, options, label: ''},
        formField2: {intent: aggregate, rowIndex: 1, label: ''},
        formField3: {intent: countDistinct, options, rowIndex: 1, label: ''},
      },
      form2: {
        formField4: {intent: sumUp, rowIndex: 0, options, label: ''},
        formField5: {intent: aggregate, rowIndex: 1, label: ''},
        formField6: {intent: countDistinct, options, rowIndex: 1, label: ''},
      },
    };
    const submissions = {
      applicant1: {
        submitter1: {
          form1: {formField1: '0', formField2: '1', formField3: '2'},
          form2: {formField4: '0', formField5: '1', formField6: '2'},
        },
      },
      applicant2: {
        submitter1: {
          form1: {formField1: '0', formField2: '1', formField3: '2'},
          // note: nobody submitted form_2 for applicant 2
        },
      },
    };

    it('only uses intent = sum_up formScore', () => {
      const report = ReportBuilder(forms, submissions);
      const expected = {
        applicant1: {form1: {mean: 0}, form2: {mean: 0}},
        applicant2: {form1: {mean: 0}},
      };
      expect(report.formScores).toEqual(expected);
    });
  });

  describe('missing field in form_submissions', () => {
    const options = ['0', '1', '2', '3', '4'].map((s) => ({
      label: s,
      value: s,
    }));

    const sumUp = 'sum_up' as 'sum_up';
    const forms = {
      form1: {
        formField1: {intent: sumUp, rowIndex: 0, options, label: ''},
        formField2: {intent: sumUp, rowIndex: 0, options, label: ''},
      },
    };
    const submissions = {
      applicant1: {submitter1: {form1: {formField1: '2', formField2: null}}},
    } as any;

    it('only uses intent = sum_up formScore', () => {
      const report = ReportBuilder(forms, submissions);
      expect(report.formFieldScores).toStrictEqual({
        applicant1: {form1: {formField1: {mean: 2, stdDev: 0}}},
      });
    });
  });
});
