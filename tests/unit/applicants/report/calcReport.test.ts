import {calcReport} from 'modules/applicants/application/calcReport';
import {Report} from 'modules/applicants/application/calcReport/report';

describe('calcReport', () => {
  const options = ['0', '1', '2', '3', '4'].map((s) => ({
    label: s,
    value: s,
  }));
  describe('Optional fields', () => {
    it('Removes optional fields if not submitted from replicase', () => {
      const formFields = {
        formField1: {
          formFieldId: 'formField1',
          intent: 'sum_up' as 'sum_up',
          rowIndex: 0,
          label: 'label-formField1',
          options,
          formId: 'form1',
          formTitle: 'form1',
          formCategory: 'assessment' as 'assessment',
        },
        formField2: {
          formFieldId: 'formField2',
          intent: 'sum_up' as 'sum_up',
          rowIndex: 1,
          label: 'label-formField1',
          options,
          formId: 'form1',
          formTitle: 'form1',
          formCategory: 'assessment' as 'assessment',
        },
        formField3: {
          formFieldId: 'formField1',
          intent: 'sum_up' as 'sum_up',
          rowIndex: 0,
          label: 'label-formField2',
          options,
          formId: 'form2',
          formTitle: 'form2',
          formCategory: 'assessment' as 'assessment',
          replicaOf: 'form1',
        },
      };

      const applicantId = 'applicant1';
      const submitterId = 'submitter1';
      const rows = [
        {
          submissionValue: '2',
          applicantId,
          submitterId,
          ...formFields.formField1,
        },
        {
          submissionValue: '2',
          applicantId,
          submitterId,
          ...formFields.formField2,
        },
        {
          submissionValue: '2',
          applicantId,
          submitterId,
          ...formFields.formField3,
        },
      ];
      const jobRequirements = [] as any[];

      const report = calcReport(rows, applicantId, jobRequirements) as Report;
      const replicas = report.formResults[0].replicas;
      const formFieldScores = replicas?.[1].formFieldScores;
      expect(formFieldScores?.length).toBe(1);
    });

    it('Removes optional fields if not submitted from non replica forms', () => {
      const formFields = {
        formField1: {
          formFieldId: 'formField1',
          intent: 'sum_up' as 'sum_up',
          rowIndex: 0,
          label: 'label-formField1',
          options,
          formId: 'form1',
          formTitle: 'form1',
          formCategory: 'assessment' as 'assessment',
        },
        formField2: {
          formFieldId: 'formField2',
          intent: 'sum_up' as 'sum_up',
          rowIndex: 1,
          label: 'label-formField1',
          options,
          formId: 'form1',
          formTitle: 'form1',
          formCategory: 'assessment' as 'assessment',
        },
      };

      const applicantId = 'applicant1';
      const submitterId = 'submitter1';
      const rows = [
        {
          submissionValue: '2',
          applicantId,
          submitterId,
          ...formFields.formField1,
        },
        {
          submissionValue: '2',
          applicantId: 'applicantId2',
          submitterId,
          ...formFields.formField2,
        },
      ];
      const jobRequirements = [] as any[];

      const report = calcReport(rows, applicantId, jobRequirements) as Report;
      expect(report.formResults[0].formFieldScores.length).toBe(1);
    });
  });
});
