import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {Report} from './types';
import {ReportBuilder} from './reportBuilder';
import {JobRequirement} from 'domain/entities';
import {mergeReplicas} from './mergeReplicas';
import {round} from './calculator';

const sort = (a: any, b: any, prop: string, ascending: boolean = true) => {
  if (ascending) return a[prop] > b[prop] ? 1 : -1;
  return a[prop] < b[prop] ? 1 : -1;
};

export const calcReport = (
  rows: ReportPrepareRow[],
  applicantId: string,
  jobRequiremnts: JobRequirement[],
) => {
  const [forms, formFields] = filterFormData(rows);
  const submissions = reduceSubmissions(rows);
  const raw = ReportBuilder(formFields, submissions);
  const report = mergeReplicas(raw, forms);

  const sorted = Object.entries(report.formCategoryScores)
    .map(([applicantId, score]) => ({applicantId, score}))
    .sort((a, b) => sort(a, b, 'score', false));

  const rank = sorted.findIndex((elem) => elem.applicantId === applicantId) + 1;
  const result: Report = {
    rank,
    formCategory: rows[0].formCategory,
    formCategoryScore: round(report.formCategoryScores[applicantId]),
    formResults: Object.entries(forms)
      .map(([formId, {formTitle, replicaOf}]) => {
        const formScore = report.formScores[applicantId][formId] as any;
        const fields = formFields[formId];
        if (replicaOf) return null;

        return {
          formId,
          formTitle,
          formScore: round(formScore.mean),
          stdDevFormScore: round(formScore.stdDev),
          formFieldScores: Object.entries(fields)
            .map(([formFieldId, value]) => {
              const {jobRequirementId, rowIndex, intent, label} = value;
              const formFieldScore =
                report.formFieldScores[applicantId][formId][formFieldId];
              return {
                formFieldId,
                jobRequirementId,
                rowIndex,
                intent,
                label,
                aggregatedValues: _.get(
                  report.aggregates,
                  `${applicantId}.${formId}.${formFieldId}`,
                  [],
                ) as string[],
                countDistinct: _.get(
                  report.countDistinct,
                  `${applicantId}.${formId}.${formFieldId}`,
                  undefined,
                ) as {[key: string]: number} | undefined,
                formFieldScore: round(formFieldScore?.mean),
                stdDevFormFieldScores: round(formFieldScore?.stdDev),
              };
            })
            .sort((a, b) => sort(a, b, 'rowIndex')) as any[],
          ...(formScore.replicas &&
          (formScore.replicas.legnth > 1 ||
            formScore.replicas[0].formId !== formId)
            ? {
                replicas: Object.entries(
                  formScore.replicas as {[key: string]: any},
                ).map(([replicaFormId, formScore]) => {
                  return {
                    formId: replicaFormId,
                    formTitle: forms[replicaFormId].formTitle,
                    formScore: round(formScore.mean),
                    stdDevFormScore: round(formScore.stdDev),
                    formFieldScores: Object.entries(fields)
                      .map(([formFieldId, value]) => {
                        const {
                          jobRequirementId,
                          rowIndex,
                          intent,
                          label,
                        } = value;
                        const formFieldScore = _.get(
                          report.formFieldScores,
                          `${applicantId}.${formId}.replicas.${replicaFormId}.${formFieldId}`,
                          [],
                        ) as any;

                        return {
                          formFieldId,
                          jobRequirementId,
                          rowIndex,
                          intent,
                          label,
                          aggregatedValues: _.get(
                            report.aggregates,
                            `${applicantId}.${formId}.replicas.${replicaFormId}.${formFieldId}`,
                            [],
                          ) as string[],
                          countDistinct: _.get(
                            report.countDistinct,
                            `${applicantId}.${formId}.replicas.${replicaFormId}.${formFieldId}`,
                            undefined,
                          ) as {[key: string]: number} | undefined,
                          formFieldScore: round(formFieldScore?.mean),
                          stdDevFormFieldScores: round(formFieldScore?.stdDev),
                        };
                      })
                      .sort((a, b) => sort(a, b, 'rowIndex')) as any[],
                  };
                }),
              }
            : {}),
        };
      })
      .filter((val) => val)
      .sort((a, b) => sort(a, b, 'formTitle')) as any[],
    jobRequirementResults: jobRequiremnts.map(
      ({jobRequirementId, requirementLabel, minValue}) => ({
        jobRequirementId,
        jobRequirementScore: round(
          _.get(
            report.jobRequirements,
            `${applicantId}.${jobRequirementId}`,
            0,
          ) as number,
        ),
        requirementLabel,
        minValue: minValue ? +minValue : undefined,
      }),
    ),
  };

  return result;
};
