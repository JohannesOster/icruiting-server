import {BaseError, catchAsync} from 'errorHandling';
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
  let data;
  if (formCategory === 'screening') {
    data = await dbSelectScreeningRanking(jobId, organization_id);
  } else if (formCategory === 'assessment') {
    data = await dbSelectAssessmentRanking(jobId, organization_id);
  } else throw new BaseError(402, 'Invalid form_category: ' + formCategory);

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
      curr.forEach(({form_field_id, intent, value, label}) => {
        if (!acc[form_field_id]) {
          const initialVal = initialValues(intent);
          acc[form_field_id] = {label, intent, value: initialVal};
        }
        switch (intent) {
          case EFormItemIntent.sumUp:
            (acc[form_field_id].value as number) += +value;
            break;
          case EFormItemIntent.aggregate:
            const val = value.toString();
            if (!val) break;
            const currArray = acc[form_field_id].value as Array<string>;
            acc[form_field_id].value = currArray.concat(val);
            break;
          case EFormItemIntent.countDistinct:
            const key = value.toString();
            const currVal = (acc[form_field_id].value as KeyVal)[key];
            (acc[form_field_id].value as KeyVal)[key] = (currVal || 0) + 1;
        }
      });

      return acc;
    }, {} as TScreeningResultObject);

    return {result: submissionsResult, ...row};
  });

  res.status(200).json(tmp);
});
