import {catchAsync} from 'errorHandling';
import {dbSelectScreeningRanking, dbSelectAssessmentRanking} from './database';
import {
  TScreeningRankingRow,
  TScreeningResultObject,
  EFormItemIntent,
  KeyVal,
} from './types';

export const getRanking = catchAsync(async (req, res) => {
  const jobId = req.params.job_id;
  const {orgID: organization_id} = res.locals.user;

  const formCategory = req.query.form_category;
  if (formCategory === 'screening') {
    const data = await dbSelectScreeningRanking(jobId, organization_id);
    const tmp = data.map((row: TScreeningRankingRow) => {
      const {submissions} = row;

      const initialValues = (key: EFormItemIntent) => {
        return {
          [EFormItemIntent.sumUp]: 0,
          [EFormItemIntent.aggregate]: [],
          [EFormItemIntent.countDistinct]: {},
        }[key];
      };
      const submissionsResult = submissions.reduce((acc, curr) => {
        curr.forEach(({form_item_id, intent, value, label}) => {
          if (!acc[form_item_id]) {
            const initialVal = initialValues(intent);
            acc[form_item_id] = {label, intent, value: initialVal};
          }
          switch (intent) {
            case EFormItemIntent.sumUp:
              (acc[form_item_id].value as number) += +value;
              break;
            case EFormItemIntent.aggregate:
              acc[form_item_id].value = (acc[form_item_id].value as Array<
                string
              >).concat(value.toString());
              break;
            case EFormItemIntent.countDistinct:
              const key = value.toString();
              const currVal = (acc[form_item_id].value as KeyVal)[key];
              (acc[form_item_id].value as KeyVal)[key] = (currVal || 0) + 1;
          }
        });

        return acc;
      }, {} as TScreeningResultObject);

      return {result: submissionsResult, ...row};
    });

    res.status(200).json(tmp);
  } else if (formCategory === 'assessment') {
    const data = await dbSelectAssessmentRanking(jobId, organization_id);
    const tmp = data.map((row: TScreeningRankingRow) => {
      const {submissions} = row;

      const initialValues = (key: EFormItemIntent) => {
        return {
          [EFormItemIntent.sumUp]: 0,
          [EFormItemIntent.aggregate]: [],
          [EFormItemIntent.countDistinct]: {},
        }[key];
      };
      const submissionsResult = submissions.reduce((acc, curr) => {
        curr.forEach(({form_item_id, intent, value, label}) => {
          if (!acc[form_item_id]) {
            const initialVal = initialValues(intent);
            acc[form_item_id] = {label, intent, value: initialVal};
          }
          switch (intent) {
            case EFormItemIntent.sumUp:
              (acc[form_item_id].value as number) += +value;
              break;
            case EFormItemIntent.aggregate:
              acc[form_item_id].value = (acc[form_item_id].value as Array<
                string
              >).concat(value.toString());
              break;
            case EFormItemIntent.countDistinct:
              const key = value.toString();
              const currVal = (acc[form_item_id].value as KeyVal)[key];
              (acc[form_item_id].value as KeyVal)[key] = (currVal || 0) + 1;
          }
        });

        return acc;
      }, {} as TScreeningResultObject);

      return {result: submissionsResult, ...row};
    });
    res.status(200).json(tmp);
  }
});
