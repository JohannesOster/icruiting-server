import _ from 'lodash';
import {round} from './calculator';
import {FormCategory, FormFieldIntent} from 'domain/entities';

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
    formScore: number;
    stdDevFormScore: number;
    formFieldScore: ReportFormFieldResult[];
    replicas?: {
      formId: string;
      formTitle: string;
      formScore: number;
      stdDevFormScore: number;
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

export type Score = {mean: number; stdDev: number};
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
    ...(formCategory !== 'onboarding' ? {formCategoryScore} : {}),
    formCategory,
    formResults: formResults
      .map(([formId, {formTitle, replicaOf, formFields}]) => {
        if (replicaOf) return null;

        const formScore = scores.formScores[applicantId][formId];
        const {mean, stdDev} = formScore;

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
          formFieldScores: Object.entries(formFields)
            .map(([formFieldId, formFieldInfo]) => {
              const formFields = scores.formFieldScores[applicantId][formId];
              const {mean, stdDev} = formFields[formFieldId] || {};

              let path = `aggregates.${applicantId}.${formId}.${formFieldId}`;
              const aggregatedValues = _.get(scores, path, []) as string[];

              path = `countDistinct.${applicantId}.${formId}.${formFieldId}`;
              const countDistinct = _.get(scores, path, {}) as {
                [key: string]: number;
              };

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
                      .sort((a, b) => sort(a, b, 'rowIndex')) as any[],
                  };
                }),
              }
            : {}),
        };
      })
      .filter((val) => val)
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
