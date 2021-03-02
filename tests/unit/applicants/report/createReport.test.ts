import {createReport} from 'application/applicants/calcReport/report';

describe('CreateReport', () => {
  it('rounds results', () => {
    const applicantId = 'applicant';
    const scores = {
      formFieldScores: {
        applicant: {form1: {formField1: {mean: 0.123, stdDev: 0.425}}},
      },
      formScores: {applicant: {form1: {mean: 0.123, stdDev: 0.425}}},
      formCategoryScores: {applicant: 0.123},
      aggregates: {},
      countDistinct: {},
      jobRequirements: {},
    };
    const forms = {
      form1: {
        formCategory: 'assessment',
        formTitle: 'formTitle',
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
          stdDevFormScore: 0.43,
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
      formScores: {applicant: {form1: {mean: 3.245, stdDev: 0.425}}},
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
          stdDevFormScore: 0.43,
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

    Object.entries(scores.jobRequirements);
    const report = createReport(applicantId, scores, forms, jobRequirements);
    expect(report).toStrictEqual({rank: 0});
  });
});
