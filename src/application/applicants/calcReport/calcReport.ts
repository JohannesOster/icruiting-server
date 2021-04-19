import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {ReportBuilder} from './reportBuilder';
import {JobRequirement} from 'domain/entities';
import {mergeReplicas} from './mergeReplicas';
import {createReport} from './report';

export const calcReport = (
  rows: ReportPrepareRow[],
  applicantId: string,
  jobRequirements: JobRequirement[],
) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  console.log(submissions.applicant1.submitter1);
  const raw = ReportBuilder(formFields, submissions);
  console.log(raw.formFieldScores.applicant1);
  const report = mergeReplicas(raw, forms);
  console.log(report.formFieldScores.applicant1.form1.replicas);

  const _forms = Object.entries(forms).reduce((acc, [formId, form]) => {
    acc[formId] = {...form, formFields: formFields[formId]};
    return acc;
  }, {} as any);

  const _jobRequirements = jobRequirements.reduce(
    (acc, {jobRequirementId, ...requirement}) => {
      acc[jobRequirementId] = requirement;
      return acc;
    },
    {} as any,
  );

  console.log(createReport(applicantId, report, _forms, _jobRequirements));

  return createReport(applicantId, report, _forms, _jobRequirements);
};
