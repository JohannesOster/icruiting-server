import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {ReportBuilder} from './reportBuilder';
import {JobRequirement} from 'domain/entities';
import {mergeReplicas} from './mergeReplicas';
import {createReport} from './report';
import {inspect} from 'util';

export const calcReport = (
  rows: ReportPrepareRow[],
  applicantId: string,
  jobRequirements: JobRequirement[],
) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  const raw = ReportBuilder(formFields, submissions);
  const report = mergeReplicas(raw, forms);

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

  return createReport(applicantId, report, _forms, _jobRequirements);
};
