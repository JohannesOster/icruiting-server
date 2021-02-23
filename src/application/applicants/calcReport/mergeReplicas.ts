import _ from 'lodash';
import {Forms, ReportBuilderReturnType} from './types';
import * as calc from './calculator';

export const mergeReplicas = (
  report: ReportBuilderReturnType,
  forms: Forms,
) => {
  const replicasMap = Object.entries(forms).reduce((acc, [formId, form]) => {
    if (!form.replicaOf) {
      if (!acc[formId]) acc[formId] = [];
      acc[formId].push(formId);
      return acc;
    }

    if (!acc[form.replicaOf]) acc[form.replicaOf] = [];
    acc[form.replicaOf].push(formId);
    return acc;
  }, {} as {[key: string]: string[]});

  Object.values(report.formFieldScores).forEach((forms) => {
    Object.entries(replicasMap).forEach(([formId, replicaIds]) => {
      replicaIds.forEach((id) => {
        const {replicas, ...formFieldScores} = forms[id];
        _.set(forms, `${formId}.replicas.${id}`, _.cloneDeep(formFieldScores)); // cloneDeep, since otherwise primary form replica will  be overwritten down below (at forms[formId][formFieldId].mean = mean;)
        if (id !== formId) delete forms[id]; // delete replicas form normal formFieldScores, primary must stay
      });

      const replicas = (forms[formId].replicas as unknown) as {
        [formId: string]: {
          [formFieldId: string]: {mean: number; stdDev: number};
        };
      };
      if (!replicas) return;

      const replicaMeans = Object.values(replicas).reduce((acc, formFields) => {
        Object.entries(formFields).forEach(([formFieldId, {mean}]) => {
          if (!acc[formFieldId]) acc[formFieldId] = [];
          acc[formFieldId].push(mean);
        });
        return acc;
      }, {} as {[key: string]: number[]});

      Object.entries(replicaMeans).forEach(([formFieldId, values]) => {
        const [mean, stdDev] = calc.score(values);
        forms[formId][formFieldId].mean = mean;
        forms[formId][formFieldId].stdDev = stdDev;
      });
    });
  });

  Object.values(report.formScores).forEach((forms) => {
    Object.entries(replicasMap).forEach(([formId, replicaIds]) => {
      replicaIds.forEach((id) => {
        const {replicas, ...score} = forms[id] as any;
        _.set(forms, `${formId}.replicas.${id}`, _.cloneDeep(score)); // cloneDeep, since otherwise primary form replica will  be overwritten down below (at forms[formId][formFieldId].mean = mean;)
        if (id !== formId) delete forms[id]; // delete replicas form normal formFieldScores, primary must stay
      });

      const replicas = ((forms[formId] as any).replicas as unknown) as {
        [formId: string]: {mean: number; stdDev: number};
      };
      if (!replicas) return;

      const replicaMeans = Object.values(replicas).map(({mean}) => mean);
      const [mean, stdDev] = calc.score(replicaMeans);
      forms[formId].mean = mean;
      forms[formId].stdDev = stdDev;
    });
  });

  Object.values(report.aggregates).forEach((forms) => {
    Object.entries(replicasMap).forEach(([formId, replicaIds]) => {
      replicaIds.forEach((id) => {
        const {replicas, ...aggregates} = forms[id];
        _.set(forms, `${formId}.replicas.${id}`, _.cloneDeep(aggregates)); // cloneDeep, since otherwise primary form replica will  be overwritten down below
        if (id !== formId) delete forms[id]; // delete replicas form normal formFieldScores, primary must stay
      });

      const replicas = (forms[formId].replicas as unknown) as {
        [formId: string]: {[formFieldId: string]: string[]};
      };
      if (!replicas) return;

      const replicaMeans = Object.values(replicas).reduce((acc, formFields) => {
        Object.entries(formFields).forEach(([formFieldId, values]) => {
          if (!acc[formFieldId]) acc[formFieldId] = [];
          acc[formFieldId] = acc[formFieldId].concat(values);
        });
        return acc;
      }, {} as {[key: string]: string[]});

      Object.entries(replicaMeans).forEach(([formFieldId, values]) => {
        forms[formId][formFieldId] = values;
      });
    });
  });

  console.log(report.aggregates?.applicant1);
  console.log(report.aggregates?.applicant1?.form1.formField1);

  return report;
};
