import _ from 'lodash';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {ReportBuilder} from './reportBuilder';
import {mergeReplicas} from './mergeReplicas';
import {createReport} from './report';
import {JobRequirement} from 'modules/jobs/domain';
import {ReportPrepareRow} from 'modules/formSubmissions/infrastructure/repositories/formSubmissions/types';

export const calcReport = (
  rows: ReportPrepareRow[],
  applicantId: string,
  jobRequirements: JobRequirement[],
) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  const raw = ReportBuilder(formFields, submissions);
  const report = mergeReplicas(raw, forms);

  const _forms = Object.entries(forms).reduce((acc, [formId, form]: any) => {
    acc[formId] = {...form, formFields: formFields[formId]};
    return acc;
  }, {} as any);

  const _jobRequirements = jobRequirements.reduce(
    (acc, {id, ...requirement}) => {
      acc[id] = requirement;
      return acc;
    },
    {} as any,
  );

  return createReport(applicantId, report, _forms, _jobRequirements);
};
