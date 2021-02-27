import _ from 'lodash';
import {ReportPrepareRow} from 'infrastructure/db/repos/formSubmissions/types';
import {filterFormData, reduceSubmissions} from './preprocessor';
import {Score, Report} from './types';
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
  const formCategory = rows[0].formCategory;
  const formCategoryScore = round(report.formCategoryScores[applicantId]);

  const formResults = Object.entries(forms);

  const result: Report = {
    rank,
    formCategory,
    formCategoryScore,
    formResults: formResults
      .map(([formId, {formTitle, replicaOf}]) => {
        if (replicaOf) return null;

        const formScore = report.formScores[applicantId][formId];
        const {mean, stdDev} = formScore;
        const fields = formFields[formId];

        type ReplicaEntry = [string, {mean: number; stdDev: number}];
        const formScoreReplicas = (formScore as any).replicas || {};
        const replicas = Object.entries(formScoreReplicas) as ReplicaEntry[];

        const hasNonPrimaryReplica = replicas[0] && replicas[0][0] !== formId;
        const addReplicas = replicas.length > 1 || hasNonPrimaryReplica;

        return {
          formId,
          formTitle,
          formScore: round(mean),
          stdDevFormScore: round(stdDev),
          formFieldScores: Object.entries(fields)
            .map(([formFieldId, value]) => {
              const {options, ...formFieldInfo} = value;
              const formFields = report.formFieldScores[applicantId][formId];
              const formFieldScore = formFields[formFieldId];

              let path = `aggregates.${applicantId}.${formId}.${formFieldId}`;
              const aggregatedValues = _.get(report, path, []) as string[];

              path = `countDistinct.${applicantId}.${formId}.${formFieldId}`;
              const countDistinct = _.get(report, path, undefined) as
                | {[key: string]: number}
                | undefined;

              return {
                formFieldId,
                ...formFieldInfo,
                aggregatedValues,
                countDistinct,
                formFieldScore: round(formFieldScore?.mean),
                stdDevFormFieldScores: round(formFieldScore?.stdDev),
              };
            })
            .sort((a, b) => sort(a, b, 'rowIndex')) as any[],
          ...(addReplicas
            ? {
                replicas: replicas.map(([replicaFormId, formScore]) => {
                  const {formTitle} = forms[replicaFormId];
                  const {mean, stdDev} = formScore;

                  return {
                    formId: replicaFormId,
                    formTitle,
                    formScore: round(mean),
                    stdDevFormScore: round(stdDev),
                    formFieldScores: Object.entries(fields)
                      .map(([formFieldId, value]) => {
                        const {options, ...formFieldInfos} = value;
                        let path = `formFieldScores.${applicantId}.${formId}.replicas.${replicaFormId}.${formFieldId}`;
                        const formFieldScore = _.get(report, path) as Score;

                        path = `aggregates.${applicantId}.${replicaFormId}.${formFieldId}`;
                        const aggregatedValues = _.get(
                          report,
                          path,
                          [],
                        ) as string[];

                        path = `countDistinct.${applicantId}.${replicaFormId}.${formFieldId}`;
                        const countDistinct = _.get(report, path, undefined) as
                          | {[key: string]: number}
                          | undefined;

                        return {
                          formFieldId,
                          ...formFieldInfos,
                          aggregatedValues,
                          countDistinct,
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
      ({jobRequirementId, requirementLabel, minValue}) => {
        const path = `jobRequirements.${applicantId}.${jobRequirementId}`;
        const jobRequirementScore = round(_.get(report, path, 0) as number);

        return {
          jobRequirementId,
          jobRequirementScore,
          requirementLabel,
          minValue: minValue ? +minValue : undefined,
        };
      },
    ),
  };

  return result;
};
