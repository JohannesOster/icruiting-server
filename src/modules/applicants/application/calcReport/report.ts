import _ from 'lodash';
import {round} from './calculator';
import {Score} from './types';
import {filterNotNullAndDefined} from 'utils/filterNotNullAndDefined';
import {FormCategory, FormFieldIntent} from 'modules/forms/domain';

type ReportFormFieldResult = {
  formFieldId: string;
  jobRequirementId?: string;
  rowIndex: number;
  intent: FormFieldIntent;
  label: string;
  aggregatedValues: string[];
  countDistinct?: {[key: string]: number};
  formFieldScore: number;
  stdDevFormFieldScore: number;
};

export type Report = {
  rank?: number;
  formCategory?: FormCategory;
  formCategoryScore?: number;
  formResults: {
    formId: string;
    formTitle: string;
    formScore?: number;
    possibleMinFormScore?: number;
    possibleMaxFormScore?: number;
    formFieldScores: ReportFormFieldResult[];
    replicas?: {
      formId: string;
      formTitle: string;
      formScore?: number;
      stdDevFormScore?: number;
      formFieldScores: ReportFormFieldResult[];
    }[];
  }[];
  jobRequirementResults: {
    jobRequirementId: string;
    jobRequirementScore: number;
    requirementLabel: string;
    minValue?: number;
  }[];
};

type FormFieldScores = {[formFieldId: string]: Score};
type FormScores = {[formId: string]: Score};

type Aggregate = string[];
type FormFieldAggregates = {[formFieldId: string]: Aggregate};

type CountDistinct = {[label: string]: number};
type FormFieldCountDistincts = {[formFieldId: string]: CountDistinct};

export type ReportScores = {
  formFieldScores: {
    [applicantId: string]: {
      [formId: string]: {
        replicas?: {[formId: string]: FormFieldScores};
      } & FormFieldScores;
    };
  };
  formScores: {
    [applicantId: string]: {[formId: string]: {replicas?: FormScores} & Score};
  };
  formCategoryScores: {[applicantId: string]: number};
  aggregates: {
    [applicantId: string]: {
      [formId: string]: {
        replicas?: {[formId: string]: FormFieldAggregates};
      } & FormFieldAggregates;
    };
  };
  countDistinct: {
    [applicantId: string]: {
      [formId: string]: {
        replicas?: {[formId: string]: FormFieldCountDistincts};
      } & FormFieldCountDistincts;
    };
  };
  jobRequirements: {
    [applicantId: string]: {[jobRequirementId: string]: number};
  };
};

type Forms = {
  [formId: string]: {
    formTitle: string;
    formCategory: string;
    replicaOf?: string;
    possibleMaxFormScore: number;
    possibleMinFormScore: number;
    formFields: {
      [formFieldId: string]: {
        intent: string;
        rowIndex: number;
        label: string;
      };
    };
  };
};

type JobRequirements = {
  [jobRequirementId: string]: {requirementLabel: string; minValue?: number};
};

export const createReport = (
  applicantId: string,
  scores: ReportScores,
  forms: Forms,
  jobRequirements: JobRequirements,
) => {
  const sort = (a: any, b: any, prop: string, ascending: boolean = true) => {
    if (ascending) return a[prop] > b[prop] ? 1 : -1;
    return a[prop] < b[prop] ? 1 : -1;
  };

  /* NOTE: if form does not include any sum_up values sorted will be empty.
  Therefore each rank will be -1 + 1 = 0 */
  const sorted = Object.entries(scores.formCategoryScores)
    .map(([applicantId, score]) => ({applicantId, score}))
    .sort((a, b) => sort(a, b, 'score', false));
  const rank = sorted.findIndex((elem) => elem.applicantId === applicantId) + 1;

  const formCategory = Object.values(forms)[0]?.formCategory as
    | FormCategory
    | undefined;
  const formCategoryScore = round(scores.formCategoryScores[applicantId]);

  const formResults = Object.entries(forms);

  if (!formResults.length) return {rank};

  const jobRequirementResults = Object.entries(
    scores.jobRequirements?.[applicantId] || {},
  );

  const report: Report = {
    ...(formCategory !== 'onboarding' ? {rank} : {}),
    ...(formCategory !== 'onboarding' && formCategoryScore
      ? {formCategoryScore}
      : {}),
    formCategory,
    formResults: formResults
      .map(([formId, form]) => {
        const {
          formTitle,
          replicaOf,
          formFields,
          possibleMaxFormScore,
          possibleMinFormScore,
        } = form;
        if (replicaOf) return null;

        const formScore = scores.formScores[applicantId]?.[formId];

        // filter empty form submissions
        let path = `aggregates.${applicantId}.${formId}`;
        const aggregateFileds = _.get(scores, path, {});
        const hasAggregateFields = !!Object.keys(aggregateFileds).length;

        path = `countDistinct.${applicantId}.${formId}`;
        const countDistinctFileds = _.get(scores, path, {});
        const hasCDFileds = !!Object.keys(countDistinctFileds).length;

        const hasEntries = hasAggregateFields || hasCDFileds || formScore;
        if (!hasEntries) return null;

        type ReplicaEntry = [string, Score];
        const formScoreReplicas = (formScore as any)?.replicas || {};
        const replicas = Object.entries(formScoreReplicas) as ReplicaEntry[];

        const hasNonPrimaryReplica = replicas[0] && replicas[0][0] !== formId;
        const addReplicas = replicas.length > 1 || hasNonPrimaryReplica;

        return {
          formId,
          formTitle,
          ...(formScore ? {formScore: round(formScore.mean)} : {}),
          possibleMaxFormScore,
          possibleMinFormScore,
          formFieldScores: Object.entries(formFields)
            .map(([formFieldId, formFieldInfo]) => {
              const formFields = scores.formFieldScores[applicantId]?.[formId];
              const {mean, stdDev} = formFields?.[formFieldId] || {};

              let path = `aggregates.${applicantId}.${formId}.${formFieldId}`;
              const aggregatedValues = _.get(scores, path, []) as string[];

              path = `countDistinct.${applicantId}.${formId}.${formFieldId}`;
              const countDistinct = _.get(scores, path, {}) as {
                [key: string]: number;
              };

              // if there is no submission return null
              if (
                mean === undefined &&
                !aggregatedValues.length &&
                !Object.keys(countDistinct).length
              )
                return null;

              return {
                formFieldId,
                ...formFieldInfo,
                aggregatedValues,
                countDistinct,
                formFieldScore: mean !== undefined ? round(mean) : null,
                stdDevFormFieldScore:
                  stdDev !== undefined ? round(stdDev) : null,
              };
            })
            .filter(filterNotNullAndDefined)
            .sort((a, b) => sort(a, b, 'rowIndex')) as any[],
          ...(addReplicas
            ? {
                replicas: replicas.map(([replicaFormId, formScore]) => {
                  const {
                    formTitle,
                    possibleMaxFormScore,
                    possibleMinFormScore,
                  } = forms[replicaFormId];

                  return {
                    formId: replicaFormId,
                    formTitle,
                    ...(formScore ? {formScore: round(formScore.mean)} : {}),
                    possibleMaxFormScore,
                    possibleMinFormScore,
                    formFieldScores: Object.entries(formFields)
                      .map(([formFieldId, formFieldInfos]) => {
                        const basePath = `${applicantId}.${formId}.replicas.${replicaFormId}.${formFieldId}`;
                        let path = `formFieldScores.${basePath}`;
                        const {mean, stdDev} = _.get(scores, path, {}) as Score;

                        path = `aggregates.${basePath}`;
                        const aggregatedValues = _.get(
                          scores,
                          path,
                          [],
                        ) as string[];

                        path = `countDistinct.${basePath}`;
                        const countDistinct = _.get(scores, path, {}) as {
                          [key: string]: number;
                        };

                        // if there is no submission return null
                        if (
                          mean === undefined &&
                          !aggregatedValues.length &&
                          !Object.keys(countDistinct).length
                        )
                          return null;

                        return {
                          formFieldId,
                          ...formFieldInfos,
                          aggregatedValues,
                          countDistinct,
                          formFieldScore:
                            mean !== undefined ? round(mean) : null,
                          stdDevFormFieldScore:
                            stdDev !== undefined ? round(stdDev) : null,
                        };
                      })
                      .filter((val) => val)
                      .sort((a, b) => sort(a, b, 'rowIndex')) as any[],
                  };
                }),
              }
            : {}),
        };
      })
      .filter(filterNotNullAndDefined)
      .sort((a, b) => sort(a, b, 'formTitle')) as any[],
    jobRequirementResults: jobRequirementResults
      .map(([jobRequirementId, score]) => {
        const jobRequirementScore = round(score);
        const {requirementLabel, minValue} = jobRequirements[jobRequirementId];

        return {
          jobRequirementId,
          jobRequirementScore,
          requirementLabel,
          ...(minValue ? {minValue: +minValue} : {}),
        };
      })
      .sort((a, b) => sort(a, b, 'requirementLabel')),
  };

  return report;
};
